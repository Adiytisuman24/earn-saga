package api

import (
	"net/http"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetWallet(c *gin.Context) {
	userId := c.MustGet("userId").(uint)

	var wallet models.Wallet
	if err := db.DB.Preload("Transactions", func(tx *gorm.DB) *gorm.DB {
		return tx.Order("timestamp desc").Limit(50)
	}).Where("user_id = ?", userId).First(&wallet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":      wallet.Balance,
		"transactions": wallet.Transactions,
	})
}
