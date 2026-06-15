package db

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     redisURL,
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		// Redis is optional — used only for dedup protection.
		// Server will still work without it; DB-level uniqueness index handles dedup.
		log.Printf("⚠️  Redis unavailable (dedup via DB only): %v", err)
		RedisClient = nil
		return
	}

	log.Println("Redis connected ✅")
}
