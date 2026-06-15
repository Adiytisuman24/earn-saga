package api

import (
	"encoding/json"
	"net/http"

	"earnsaga-lite/backend-go/internal/db"
	"earnsaga-lite/backend-go/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

type SeedOffer struct {
	OfferID     string
	Name        string
	IcURL       string
	PayoutUSD   float64
	InappPytAmt int
	DescRaw     string
	TrkURL      string
	OffType     string
	OS          string
	Goals       []map[string]string
}

var seedOffers = []SeedOffer{
	{
		OfferID: "demo_001", Name: "Coin Master — Reach Level 50",
		IcURL: "https://play-lh.googleusercontent.com/7uDjhYsLJGr7kSDOJcxzVBLXJcqfLiXBbFo7RMzH9h-jD3Xm4fqVFHPz_UXvGQ_J2A=w480-h960",
		PayoutUSD: 3.50, InappPytAmt: 350, OffType: "App", OS: "Android",
		DescRaw: "Download Coin Master and reach <b>Level 50</b> to earn 350 coins!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_001&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Download Coin Master", "instr": "Install from Play Store"}, {"ttl": "Reach Level 50", "instr": "Play and spin to reach level 50"}},
	},
	{
		OfferID: "demo_002", Name: "RAID: Shadow Legends — Day 7",
		IcURL: "https://play-lh.googleusercontent.com/rqkCH9lOXlPDNnxv7MVzMcRv8j0TtIB9YkPpHalJAqKMa_sOiJJJJeMCeRWEedTXXA=w480-h960",
		PayoutUSD: 5.00, InappPytAmt: 500, OffType: "Game", OS: "iOS",
		DescRaw: "Install <b>RAID: Shadow Legends</b> and play for 7 consecutive days!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_002&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Install the game", "instr": "Download from App Store"}, {"ttl": "Play 7 days in a row", "instr": "Log in daily for 7 days"}},
	},
	{
		OfferID: "demo_003", Name: "Survey — US Consumer Panel",
		IcURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Survey_icon.svg/240px-Survey_icon.svg.png",
		PayoutUSD: 1.50, InappPytAmt: 150, OffType: "Survey", OS: "All",
		DescRaw: "Complete a <b>5-minute survey</b> about consumer habits and earn 150 coins!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_003&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Complete survey", "instr": "Answer all questions honestly"}},
	},
	{
		OfferID: "demo_004", Name: "Subway Surfers — Score 500K",
		IcURL: "https://play-lh.googleusercontent.com/MVKaFxmOHQTDTRv0yJAGYYKw1fI78s-wBdMXNk_TgNBX8lCDDmkfUomfGOe16fPRmQ=w480-h960",
		PayoutUSD: 2.00, InappPytAmt: 200, OffType: "Game", OS: "Android",
		DescRaw: "Download <b>Subway Surfers</b> and score 500,000 points to unlock your reward!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_004&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Download game", "instr": "Install from Play Store"}, {"ttl": "Score 500K", "instr": "Run, jump and dodge obstacles"}},
	},
	{
		OfferID: "demo_005", Name: "Duolingo — 7-Day Streak",
		IcURL: "https://play-lh.googleusercontent.com/0hDN4Ao5VXKOFXe4hQILUlFqH9Dt-KWWG5ggbQvLuoUYgZzxcO0R0iBPklz1vlSiOXA=w480-h960",
		PayoutUSD: 2.50, InappPytAmt: 250, OffType: "App", OS: "iOS",
		DescRaw: "Learn a new language with <b>Duolingo</b>! Maintain a 7-day streak to earn coins.",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_005&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Install Duolingo", "instr": "Download from App Store"}, {"ttl": "Keep a 7-day streak", "instr": "Complete at least one lesson daily"}},
	},
	{
		OfferID: "demo_006", Name: "Fiverr — First Order",
		IcURL: "https://logowik.com/content/uploads/images/fiverr-new2799.jpg",
		PayoutUSD: 8.00, InappPytAmt: 800, OffType: "Shopping", OS: "All",
		DescRaw: "Place your <b>first order</b> on Fiverr and get 800 coins instantly credited!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_006&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Sign up on Fiverr", "instr": "Create a free account"}, {"ttl": "Place your first order", "instr": "Buy any service"}},
	},
	{
		OfferID: "demo_007", Name: "Clash of Clans — Town Hall 8",
		IcURL: "https://play-lh.googleusercontent.com/A6y8kFPu6iiFg7RSkGxyNspjOBmeaD3oAOip5dqQvXAznOMfNyHMBPycaXSPCOXELA=w480-h960",
		PayoutUSD: 4.00, InappPytAmt: 400, OffType: "Game", OS: "Android",
		DescRaw: "Build your village in <b>Clash of Clans</b> and reach Town Hall Level 8!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_007&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Install the game", "instr": "Download from Play Store"}, {"ttl": "Reach Town Hall 8", "instr": "Upgrade your town hall"}},
	},
	{
		OfferID: "demo_008", Name: "NordVPN — 1-Month Trial",
		IcURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/NordVPN_Logo.svg/240px-NordVPN_Logo.svg.png",
		PayoutUSD: 12.00, InappPytAmt: 1200, OffType: "Subscription", OS: "All",
		DescRaw: "Sign up for <b>NordVPN</b>'s 1-month trial and earn 1200 coins!",
		TrkURL:  "https://api-dev.sikkaapp.in/v1/offer/redirect?offer_id=demo_008&app_id=66555042&sub_id={your_user_id}",
		Goals:   []map[string]string{{"ttl": "Sign up for NordVPN", "instr": "Create account and start trial"}},
	},
}

func SeedDemoOffers(c *gin.Context) {
	seeded := 0
	for _, o := range seedOffers {
		goalsBytes, _ := json.Marshal(o.Goals)
		offer := models.Offer{
			OfferID:     o.OfferID,
			Name:        o.Name,
			IcURL:       o.IcURL,
			PayoutUSD:   o.PayoutUSD,
			InappPytAmt: o.InappPytAmt,
			DescRaw:     o.DescRaw,
			TrkURL:      o.TrkURL,
			OffType:     o.OffType,
			OS:          o.OS,
			Goals:       datatypes.JSON(goalsBytes),
		}
		result := db.DB.Where("offer_id = ?", o.OfferID).First(&models.Offer{})
		if result.Error != nil {
			db.DB.Create(&offer)
			seeded++
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Demo offers seeded", "seeded": seeded, "total": len(seedOffers)})
}
