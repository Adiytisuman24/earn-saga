package main

import (
	"log"
	"time"

	"earnsaga-lite/backend-go/internal/api"
	"earnsaga-lite/backend-go/internal/db"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	db.InitDB()
	db.InitRedis()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:5000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api.RegisterRoutes(r)

	log.Println("Server running on port 3000")
	if err := r.Run(":3000"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
