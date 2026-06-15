package db

import (
	"log"
	"os"

	"earnsaga-lite/backend-go/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=root password=password dbname=earnsaga port=5433 sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.Wallet{},
		&models.Offer{},
		&models.UserOffer{},
		&models.Transaction{},
		&models.CallbackLog{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	log.Println("Database connected and migrated")
}
