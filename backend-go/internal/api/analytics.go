package api

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type TrackActivityRequest struct {
	Action   string         `json:"action" binding:"required"`
	Metadata datatypes.JSON `json:"metadata"`
}

func TrackActivity(c *gin.Context) {
	userId, exists := c.Get("userId")
	if !exists {
		// allow anonymous tracking if needed, or just return 401
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req TrackActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ip := c.ClientIP()
	userAgent := c.Request.UserAgent()

	// Truncate user agent if it's absurdly long
	if len(userAgent) > 255 {
		userAgent = userAgent[:255]
	}

	// Basic safety check for empty metadata
	if len(strings.TrimSpace(string(req.Metadata))) == 0 {
		req.Metadata = datatypes.JSON([]byte("{}"))
	}

	logEntry := models.ActivityLog{
		UserID:    userId.(uint),
		Action:    req.Action,
		Metadata:  req.Metadata,
		IPAddress: ip,
		UserAgent: userAgent,
	}

	if err := db.DB.Create(&logEntry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track activity"})
		return
	}

	// Reward Logic for PAGE_VIEW
	if req.Action == "PAGE_VIEW" {
		pointsPerView := 5
		maxDailyPoints := 50
		uid := userId.(uint)

		today := time.Now().Truncate(24 * time.Hour)
		var totalEarned int64

		var wallet models.Wallet
		if err := db.DB.Where("user_id = ?", uid).First(&wallet).Error; err == nil {
			db.DB.Model(&models.Transaction{}).
				Where("wallet_id = ? AND type = ? AND reference LIKE ? AND timestamp >= ?", wallet.ID, "CREDIT", "Engagement Reward%", today).
				Select("COALESCE(SUM(amount), 0)").Scan(&totalEarned)

			if int(totalEarned)+pointsPerView <= maxDailyPoints {
				db.DB.Transaction(func(tx *gorm.DB) error {
					if err := tx.Model(&wallet).Update("balance", gorm.Expr("balance + ?", pointsPerView)).Error; err != nil {
						return err
					}

					txRecord := models.Transaction{
						WalletID:  wallet.ID,
						Amount:    pointsPerView,
						Type:      "CREDIT",
						Reference: fmt.Sprintf("Engagement Reward: %s", req.Action),
					}
					return tx.Create(&txRecord).Error
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
