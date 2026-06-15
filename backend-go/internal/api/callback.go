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
	pubscaleKey := os.Getenv("PUBSCALE_KEY")
	if pubscaleKey == "" {
		pubscaleKey = "6b80727c-016c-4cc3-9615-0470a51828b2"
	}

	valueInt := int(value) // truncate to integer as per docs
	// Build signature string with dot separators: key.userId.intValue.token
	sigInput := fmt.Sprintf("%s.%d.%d.%s", pubscaleKey, userId, valueInt, pubscaleToken)
	hash := md5.Sum([]byte(sigInput))
	expectedSig := hex.EncodeToString(hash[:])

	log.Printf("[S2S] sig_input=%q  expected=%s  received=%s", sigInput, expectedSig, signature)

	if signature != expectedSig {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid signature"})
		return
	}

	// ── 3. Idempotency — check Redis first (fast path) ──────────────────────
	redisKey := "callback:" + pubscaleToken
	exists, _ := db.RedisClient.Exists(db.Ctx, redisKey).Result()
	if exists > 0 {
		log.Printf("[S2S] Already processed (Redis): token=%s", pubscaleToken)
		c.JSON(http.StatusOK, gin.H{"message": "Already processed"})
		return
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
	db.RedisClient.Set(db.Ctx, redisKey, "1", 30*24*time.Hour)

	log.Printf("[S2S] ✅ Success: user=%d credited=%d coins token=%s", userId, valueInt, pubscaleToken)

	// ── 7. Return HTTP 200 so PubScale marks delivery as successful ─────────
	c.JSON(http.StatusOK, gin.H{"message": "Success"})
}

func SimulateCallbackPage(c *gin.Context) {
	userId := c.Query("user_id")
	offerId := c.Query("offer_id")
	value := c.Query("value")
	name := c.Query("name")
	token := fmt.Sprintf("sim_%d_%s_%d", time.Now().Unix(), userId, offerId)

	// Build signature formula: MD5(secret_key.user_id.int(value).token)
	pubscaleKey := os.Getenv("PUBSCALE_KEY")
	if pubscaleKey == "" {
		pubscaleKey = "6b80727c-016c-4cc3-9615-0470a51828b2"
	}
	sigInput := fmt.Sprintf("%s.%s.%s.%s", pubscaleKey, userId, value, token)
	hash := md5.Sum([]byte(sigInput))
	signature := hex.EncodeToString(hash[:])

	html := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>Simulate Offer Completion</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body {
				background-color: #0A0514;
				color: #FFFFFF;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 100vh;
				margin: 0;
				padding: 20px;
				box-sizing: border-box;
			}
			.card {
				background: rgba(255, 255, 255, 0.05);
				border: 1px solid rgba(255, 255, 255, 0.1);
				border-radius: 24px;
				padding: 40px;
				max-width: 480px;
				width: 100%%;
				text-align: center;
				backdrop-filter: blur(10px);
			}
			h1 {
				color: #10B981;
				font-size: 24px;
				font-weight: 900;
				margin-bottom: 8px;
			}
			p {
				color: #94A3B8;
				line-height: 1.5;
				margin-bottom: 24px;
			}
			.info {
				background: rgba(255, 255, 255, 0.02);
				border: 1px solid rgba(255, 255, 255, 0.05);
				border-radius: 16px;
				padding: 16px;
				margin-bottom: 24px;
				text-align: left;
			}
			.info-row {
				display: flex;
				justify-content: space-between;
				margin-bottom: 8px;
				font-size: 14px;
			}
			.info-row:last-child {
				margin-bottom: 0;
			}
			.label { color: #64748B; font-weight: 600; }
			.val { color: #FFFFFF; font-weight: 700; }
			.btn {
				background: #10B981;
				color: #0A0514;
				font-weight: 950;
				font-size: 18px;
				border: none;
				border-radius: 16px;
				padding: 16px 32px;
				cursor: pointer;
				width: 100%%;
				transition: all 0.2s;
				box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
			}
			.btn:hover {
				background: #34D399;
				transform: translateY(-2px);
			}
			.btn:active {
				transform: translateY(0);
			}
		</style>
	</head>
	<body>
		<div class="card">
			<h1>Offer Simulation</h1>
			<p>You have been redirected to complete <strong>%s</strong>.</p>
			
			<div class="info">
				<div class="info-row">
					<span class="label">Offer Name:</span>
					<span class="val">%s</span>
				</div>
				<div class="info-row">
					<span class="label">User ID:</span>
					<span class="val">%s</span>
				</div>
				<div class="info-row">
					<span class="label">Value:</span>
					<span class="val" style="color: #10B981;">+%s Coins</span>
				</div>
			</div>

			<form action="%s" method="GET" style="margin: 0;">
				<input type="hidden" name="user_id" value="%s">
				<input type="hidden" name="value" value="%s">
				<input type="hidden" name="token" value="%s">
				<input type="hidden" name="signature" value="%s">
				<button type="submit" class="btn">Complete Task & Claim Reward</button>
			</form>
		</div>
	</body>
	</html>
	`, name, name, userId, value, "/api/callback", userId, value, token, signature)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
