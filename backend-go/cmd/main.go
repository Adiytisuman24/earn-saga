package main

import (
	"log"
	"os"
	"time"

	"earnsaga-lite/backend-go/internal/api"
	"earnsaga-lite/backend-go/internal/db"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env only if env vars are not already set (local dev only)
	// On Render/production, env vars are injected directly and take priority
	_ = godotenv.Load()

	db.InitDB()
	db.InitRedis()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:3000",
			"http://localhost:5000",
			"https://earn-saga.vercel.app",
			"https://earnsaga.vercel.app",
			"https://earn-saga-sepia.vercel.app",
			// wildcard for any vercel preview
			"https://earn-saga-git-main-adiytisuman24.vercel.app",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check — Render pings this to verify the service is alive
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "EarnSaga API"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api.RegisterRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
