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

type PayoutRequest struct {
	Amount int    `json:"amount" binding:"required,min=100"`
	Method string `json:"method" binding:"required"`
}

func RequestPayout(c *gin.Context) {
	userId := c.MustGet("userId").(uint)
	var req PayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payout request. Minimum 100 coins."})
		return
	}

	var newBalance int
	insufficient := false

	txErr := db.DB.Transaction(func(tx *gorm.DB) error {
		var wallet models.Wallet
		// Lock the row for update to prevent race conditions
		if err := tx.Where("user_id = ?", userId).First(&wallet).Error; err != nil {
			return err
		}

		if wallet.Balance < req.Amount {
			insufficient = true
			return nil // Return nil to avoid rolling back and throwing 500
		}

		wallet.Balance -= req.Amount
		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		txRecord := models.Transaction{
			WalletID:  wallet.ID,
			Amount:    req.Amount,
			Type:      "DEBIT",
			Reference: "Payout: " + req.Method,
		}
		if err := tx.Create(&txRecord).Error; err != nil {
			return err
		}

		newBalance = wallet.Balance
		return nil
	})

	if txErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payout"})
		return
	}
	if insufficient {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Payout requested successfully", "new_balance": newBalance})
}
