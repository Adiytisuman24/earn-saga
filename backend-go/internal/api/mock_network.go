package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// MockNetworkClick handles the simulated tracking redirect
func MockNetworkClick(c *gin.Context) {
	userId := c.Query("user_id")
	offerId := c.Query("offer_id")
	value := c.Query("value")
	name := c.Query("name")

	// Generate a simulated click ID
	clickId := uuid.New().String()

	// In a real network, this would redirect to the actual NordVPN checkout.
	// For our simulation, we render a highly stylized mock checkout page.
	html := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<title>%[1]s Checkout</title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body {
				background-color: #F8FAFC;
				color: #0F172A;
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
				background: #FFFFFF;
				border: 1px solid #E2E8F0;
				border-radius: 24px;
				padding: 40px;
				max-width: 480px;
				width: 100%%;
				text-align: center;
				box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
			}
			h1 {
				color: #0F172A;
				font-size: 24px;
				font-weight: 900;
				margin-bottom: 8px;
			}
			p {
				color: #64748B;
				line-height: 1.5;
				margin-bottom: 24px;
			}
			.info {
				background: #F1F5F9;
				border: 1px solid #E2E8F0;
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
			.val { color: #0F172A; font-weight: 700; }
			.btn {
				background: #2563EB;
				color: #FFFFFF;
				font-weight: 800;
				font-size: 16px;
				border: none;
				border-radius: 12px;
				padding: 16px 32px;
				cursor: pointer;
				width: 100%%;
				transition: all 0.2s;
			}
			.btn:hover {
				background: #1D4ED8;
				transform: translateY(-2px);
				box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
			}
			.btn:active {
				transform: translateY(0);
			}
			.simulation-badge {
				display: inline-block;
				background: #FEF2F2;
				color: #EF4444;
				padding: 4px 12px;
				border-radius: 100px;
				font-size: 12px;
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				margin-bottom: 16px;
			}
		</style>
	</head>
	<body>
		<div class="card">
			<div class="simulation-badge">Mock Destination Website</div>
			<h1>%[1]s Checkout</h1>
			<p>You have been securely redirected via tracking link.<br>Complete your purchase to trigger the postback.</p>
			
			<div class="info">
				<div class="info-row">
					<span class="label">Product:</span>
					<span class="val">%[1]s Subscription</span>
				</div>
				<div class="info-row">
					<span class="label">Click ID:</span>
					<span class="val" style="font-family: monospace; font-size: 11px;">%[2]s</span>
				</div>
				<div class="info-row">
					<span class="label">Price:</span>
					<span class="val">$9.99 / month</span>
				</div>
			</div>

			<form action="/api/mock-network/purchase" method="POST" style="margin: 0;">
				<input type="hidden" name="click_id" value="%[2]s">
				<input type="hidden" name="user_id" value="%[3]s">
				<input type="hidden" name="offer_id" value="%[4]s">
				<input type="hidden" name="value" value="%[5]s">
				<button type="submit" class="btn">Complete Purchase (Simulate)</button>
			</form>
		</div>
	</body>
	</html>
	`, name, clickId, userId, offerId, value)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

// MockNetworkPurchase handles the simulated purchase and fires the S2S postback
func MockNetworkPurchase(c *gin.Context) {
	clickId := c.PostForm("click_id")
	userId := c.PostForm("user_id")
	offerId := c.PostForm("offer_id")
	value := c.PostForm("value")

	// Generate a token to represent the transaction
	token := fmt.Sprintf("mock_%d_%s_%s", time.Now().Unix(), clickId, offerId)

	// Fetch the active PubScale Secret Key
	pubscaleKey := os.Getenv("PUBSCALE_KEY")
	if pubscaleKey == "" {
		pubscaleKey = "C423E0560E41A9EF42876CC684CB1F74"
	}

	// Calculate HMAC Signature: MD5(secret_key.user_id.int(value).token)
	sigInput := fmt.Sprintf("%s.%s.%s.%s", pubscaleKey, userId, value, token)
	hash := md5.Sum([]byte(sigInput))
	signature := hex.EncodeToString(hash[:])

	// Determine the base URL of our own server to fire the callback
	scheme := "http"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := c.Request.Host
	callbackUrl := fmt.Sprintf("%s://%s/api/callback?user_id=%s&value=%s&token=%s&signature=%s", scheme, host, url.QueryEscape(userId), url.QueryEscape(value), url.QueryEscape(token), url.QueryEscape(signature))

	// Fire the S2S Postback to our real callback endpoint
	resp, err := http.Get(callbackUrl)
	if err != nil || resp.StatusCode != http.StatusOK {
		// If internal routing fails (e.g., local networking), we fallback to direct redirect
		// This ensures the demo doesn't break if server cannot call itself
		fallbackUrl := fmt.Sprintf("/api/callback?user_id=%s&value=%s&token=%s&signature=%s&redirect=true", url.QueryEscape(userId), url.QueryEscape(value), url.QueryEscape(token), url.QueryEscape(signature))
		c.Redirect(http.StatusFound, fallbackUrl)
		return
	}
	defer resp.Body.Close()

	// Redirect back to EarnSaga wallet
	c.Redirect(http.StatusFound, "/wallet")
}
