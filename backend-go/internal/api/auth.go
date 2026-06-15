package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte(os.Getenv("JWT_SECRET"))

func init() {
	if len(JWTSecret) == 0 {
		JWTSecret = []byte("supersecretkey_earnsaga_2026")
	}
}

type GoogleAuthReq struct {
	Token string `json:"token" binding:"required"`
}

type GoogleUserInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func GoogleLogin(c *gin.Context) {
	var req GoogleAuthReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch user info from Google using the access token
	resp, err := http.Get(fmt.Sprintf("https://www.googleapis.com/oauth2/v3/userinfo?access_token=%s", req.Token))
	if err != nil || resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
		return
	}
	defer resp.Body.Close()

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to parse Google user info"})
		return
	}

	if userInfo.Email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Could not get email from Google"})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", userInfo.Email).First(&user).Error; err != nil {
		user = models.User{
			Email:   userInfo.Email,
			Name:    userInfo.Name,
			Picture: userInfo.Picture,
		}
		if err := db.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		wallet := models.Wallet{UserID: user.ID, Balance: 0}
		db.DB.Create(&wallet)
	} else {
		// Update name/picture in case they changed
		db.DB.Model(&user).Updates(models.User{Name: userInfo.Name, Picture: userInfo.Picture})
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": user.ID,
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(),
	})

	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set HttpOnly cookie
	c.SetCookie("token", tokenString, 3600*24*7, "/", "", false, true) // Secure false for local

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in successfully",
		"user": gin.H{
			"id":      user.ID,
			"name":    user.Name,
			"email":   user.Email,
			"picture": user.Picture,
		},
	})
}

// AuthMiddleware to protect routes
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Set("userId", uint(claims["userId"].(float64)))
		c.Next()
	}
}

func GetMe(c *gin.Context) {
	userId := c.MustGet("userId").(uint)
	var user models.User
	if err := db.DB.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
