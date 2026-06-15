package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

func GetOffers(c *gin.Context) {
	search := c.Query("search")
	var offers []models.Offer

	query := db.DB.Order("payout_usd desc")
	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Find(&offers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"offers": offers})
}

func GetOfferDetails(c *gin.Context) {
	id := c.Param("id")
	userId := c.MustGet("userId").(uint)

	var offer models.Offer
	if err := db.DB.First(&offer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer not found"})
		return
	}

	var userOffer models.UserOffer
	db.DB.Where("user_id = ? AND offer_id = ?", userId, offer.ID).First(&userOffer)

	c.JSON(http.StatusOK, gin.H{
		"offer":     offer,
		"userOffer": userOffer,
	})
}

func StartOffer(c *gin.Context) {
	id := c.Param("id")
	userId := c.MustGet("userId").(uint)

	var offer models.Offer
	if err := db.DB.First(&offer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer not found"})
		return
	}

	var userOffer models.UserOffer
	result := db.DB.Where("user_id = ? AND offer_id = ?", userId, offer.ID).First(&userOffer)

	if result.Error == nil {
		if userOffer.Status == "COMPLETED" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "COMPLETED"})
			return
		}
	} else {
		userOffer = models.UserOffer{
			UserID:  userId,
			OfferID: offer.ID,
			Status:  "IN_PROGRESS",
		}
		db.DB.Create(&userOffer)
	}

	trackingURL := offer.TrkURL
	if trackingURL == "" {
		trackingURL = fmt.Sprintf("https://earnsaga.example.com/track?user=%d&offer=%s", userId, offer.OfferID)
	} else {
		// Replace common placeholder tokens so PubScale attributes correctly
		replacements := map[string]string{
			"{your_user_id}": fmt.Sprintf("%d", userId),
			"{USER_ID}":      fmt.Sprintf("%d", userId),
			"[USER_ID]":      fmt.Sprintf("%d", userId),
			"{subid}":        fmt.Sprintf("%d", userId),
		}
		for k, v := range replacements {
			if len(trackingURL) > 0 {
				trackingURL = replaceAll(trackingURL, k, v)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"redirectUrl": trackingURL,
	})
}

func replaceAll(s, old, new string) string {
	result := s
	for {
		idx := indexOf(result, old)
		if idx < 0 {
			break
		}
		result = result[:idx] + new + result[idx+len(old):]
	}
	return result
}

func indexOf(s, sub string) int {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

// PubScale API response structures
type pubscaleOffer struct {
	ID    interface{} `json:"id"`
	Name  string      `json:"name"`
	IcURL string      `json:"ic_url"`
	Pyt   struct {
		Amt float64 `json:"amt"`
	} `json:"pyt"`
	InappPyt struct {
		Amt interface{} `json:"amt"`
	} `json:"inapp_pyt"`
	Desc struct {
		Raw string `json:"raw"`
	} `json:"desc"`
	TrkURL  string      `json:"trk_url"`
	OffType string      `json:"off_type"`
	OS      string      `json:"os"`
	GeoTgt  interface{} `json:"geo_tgt"`
	UpdTs   int64       `json:"upd_ts"`
	Gls     interface{} `json:"gls"`
}

func SyncOffers(c *gin.Context) {
	appId := os.Getenv("PUBSCALE_APP_ID")
	pubKey := os.Getenv("PUBSCALE_KEY")
	if appId == "" {
		appId = "66555042"
	}
	if pubKey == "" {
		pubKey = "C423E0560E41A9EF42876CC684CB1F74"
	}

	apiURL := "https://api-dev.sikkaapp.in/v1/offer/api"

	reqBody, _ := json.Marshal(map[string]interface{}{})
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build request"})
		return
	}
	req.Header.Set("App-Id", appId)
	req.Header.Set("Pub-Key", pubKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to call PubScale API: %v", err)})
		return
	}
	defer resp.Body.Close()

	// Try to decode the nested response structure
	var rawResult map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse PubScale response"})
		return
	}

	// Extract offers array from nested paths
	var offerList []pubscaleOffer
	rawBytes, _ := json.Marshal(rawResult)

	// Try different keys: offers, data.offers, data
	var wrapper struct {
		Offers []pubscaleOffer `json:"offers"`
		Data   struct {
			Offers []pubscaleOffer `json:"offers"`
		} `json:"data"`
	}
	_ = json.Unmarshal(rawBytes, &wrapper)

	if len(wrapper.Offers) > 0 {
		offerList = wrapper.Offers
	} else if len(wrapper.Data.Offers) > 0 {
		offerList = wrapper.Data.Offers
	} else {
		// Try root as array
		var direct []pubscaleOffer
		if err := json.Unmarshal(rawBytes, &direct); err == nil && len(direct) > 0 {
			offerList = direct
		}
	}

	synced := 0
	for _, o := range offerList {
		// Normalize offer ID
		var offerId string
		switch v := o.ID.(type) {
		case float64:
			offerId = strconv.Itoa(int(v))
		case string:
			offerId = v
		default:
			continue
		}

		// Normalize inapp_pyt amount
		var inappAmt int
		switch v := o.InappPyt.Amt.(type) {
		case float64:
			inappAmt = int(v)
		case string:
			inappAmt, _ = strconv.Atoi(v)
		}

		goalsBytes, _ := json.Marshal(o.Gls)

		offer := models.Offer{
			OfferID:       offerId,
			Name:          o.Name,
			IcURL:         o.IcURL,
			PayoutUSD:     o.Pyt.Amt,
			InappPytAmt:   inappAmt,
			DescRaw:       o.Desc.Raw,
			TrkURL:        o.TrkURL,
			OffType:       o.OffType,
			OS:            o.OS,
			PubscaleUpdTs: o.UpdTs,
			Goals:         datatypes.JSON(goalsBytes),
		}

		db.DB.Where("offer_id = ?", offerId).Assign(offer).FirstOrCreate(&offer)
		synced++
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Offers synced successfully",
		"synced":     synced,
		"raw_status": resp.StatusCode,
		"raw_keys":   getKeys(rawResult),
	})
}

func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
