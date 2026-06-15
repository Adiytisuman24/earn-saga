package api

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	// Root level callback route for PubScale S2S webhook to match user expectations exactly
	r.GET("/callback", Callback)

	api := r.Group("/api")

	api.POST("/auth/google", GoogleLogin)
	api.GET("/callback", Callback)       // S2S Callback from PubScale
	api.POST("/offers/sync", SyncOffers) // Sync from PubScale API
	api.POST("/seed", SeedDemoOffers)    // Seed demo offers (dev only)

	protected := api.Group("/")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/auth/me", GetMe)
		protected.POST("/auth/logout", Logout)

		protected.GET("/offers", GetOffers)
		protected.GET("/offers/:id", GetOfferDetails)
		protected.POST("/offers/:id/start", StartOffer)

		protected.GET("/wallet", GetWallet)
	}
}
