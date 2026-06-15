package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Callback(c *gin.Context) {
	// ── 1. Read all query parameters ───────────────────────────────────────
	pubscaleToken := c.Query("token")
	valueStr := c.Query("value")
	signature := c.Query("signature")

	// user_id can come as user_id, sub_id, or subId1 depending on how trk_url was built
	userIdStr := c.Query("user_id")
	if userIdStr == "" {
		userIdStr = c.Query("sub_id")
	}
	if userIdStr == "" {
		userIdStr = c.Query("subId1")
	}
	if userIdStr == "" {
		userIdStr = c.Query("aff_sub")
	}

	log.Printf("[S2S] user_id=%s value=%s token=%s signature=%s",
		userIdStr, valueStr, pubscaleToken, signature)

	if pubscaleToken == "" || userIdStr == "" || valueStr == "" || signature == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid value parameter"})
		return
	}
	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id parameter"})
		return
	}

	// ── 2. Verify Signature ─────────────────────────────────────────────────
	// Formula: MD5(secret_key.user_id.int(value).token)
	// The dots are LITERAL separators in the concatenated string
	pubscaleSecret := os.Getenv("PUBSCALE_SECRET_KEY")
	if pubscaleSecret == "" {
		pubscaleSecret = "6b80727c-016c-4cc3-9615-0470a51828b2"
	}

	valueInt := int(value) // truncate to integer as per docs
	sigInput := fmt.Sprintf("%s.%d.%d.%s", pubscaleSecret, userId, valueInt, pubscaleToken)
	hash := md5.Sum([]byte(sigInput))
	expectedSig := hex.EncodeToString(hash[:])

	log.Printf("[S2S] sig_input=%q  expected=%s  received=%s", sigInput, expectedSig, signature)

	if signature != expectedSig {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// ── 3. Idempotency — check Redis first (fast path) ──────────────────────
	redisKey := "callback:" + pubscaleToken
	if db.RedisClient != nil {
		exists, _ := db.RedisClient.Exists(db.Ctx, redisKey).Result()
		if exists > 0 {
			log.Printf("[S2S] Already processed (Redis): token=%s", pubscaleToken)
			c.JSON(http.StatusOK, gin.H{"message": "Already processed"})
			return
		}
	}

	// ── 4+5. Atomic DB transaction — credit wallet + mark offer complete ─────
	txErr := db.DB.Transaction(func(tx *gorm.DB) error {
		// DB-level idempotency check (fallback if Redis was restarted)
		var existingLog models.CallbackLog
		if tx.Where("pubscale_token = ?", pubscaleToken).First(&existingLog).Error == nil {
			log.Printf("[S2S] Already processed (DB): token=%s", pubscaleToken)
			return nil
		}

		// a) Log the callback
		callbackLog := models.CallbackLog{
			PubscaleToken: pubscaleToken,
			UserID:        uint(userId),
			Value:         value,
			Status:        "SUCCESS",
		}
		if err := tx.Create(&callbackLog).Error; err != nil {
			return fmt.Errorf("failed to create callback log: %w", err)
		}

		// b) Find + credit the wallet
		var wallet models.Wallet
		if err := tx.Where("user_id = ?", userId).First(&wallet).Error; err != nil {
			return fmt.Errorf("wallet not found for user_id=%d: %w", userId, err)
		}

		wallet.Balance += valueInt
		if err := tx.Save(&wallet).Error; err != nil {
			return fmt.Errorf("failed to update wallet balance: %w", err)
		}

		// c) Create transaction record
		txRecord := models.Transaction{
			WalletID:  wallet.ID,
			Amount:    valueInt,
			Type:      "CREDIT",
			Reference: fmt.Sprintf("offer_%s", pubscaleToken),
		}
		if err := tx.Create(&txRecord).Error; err != nil {
			return fmt.Errorf("failed to create transaction: %w", err)
		}

		// d) Mark the most recent IN_PROGRESS offer for this user as COMPLETED
		var userOffer models.UserOffer
		if err := tx.Where("user_id = ? AND status = ?", userId, "IN_PROGRESS").
			Order("created_at desc").
			First(&userOffer).Error; err == nil {
			userOffer.Status = "COMPLETED"
			tx.Save(&userOffer)
			log.Printf("[S2S] Marked offer %d as COMPLETED for user %d", userOffer.OfferID, userId)
		}

		return nil
	})

	if txErr != nil {
		log.Printf("[S2S] Transaction failed: %v", txErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback"})
		return
	}

	// ── 6. Set Redis flag to prevent future duplicates ──────────────────────
	if db.RedisClient != nil {
		db.RedisClient.Set(db.Ctx, redisKey, "1", 30*24*time.Hour)
	}

	log.Printf("[S2S] ✅ Success: user=%d credited=%d coins token=%s", userId, valueInt, pubscaleToken)

	// ── 7. Return HTTP 200 or redirect so PubScale marks delivery as successful ─────────
	if c.Query("redirect") == "true" {
		c.Redirect(http.StatusFound, "/wallet")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Success"})
}
