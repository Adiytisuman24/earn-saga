package models

import (
	"time"

	"gorm.io/datatypes"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Name      string    `json:"name"`
	Picture   string    `json:"picture"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Wallet    Wallet    `gorm:"foreignKey:UserID" json:"wallet"`
}

type Wallet struct {
	ID           uint          `gorm:"primaryKey" json:"id"`
	UserID       uint          `gorm:"uniqueIndex" json:"user_id"`
	Balance      int           `gorm:"default:0" json:"balance"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	Transactions []Transaction `gorm:"foreignKey:WalletID" json:"transactions,omitempty"`
}

type Offer struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	OfferID       string         `gorm:"uniqueIndex" json:"offer_id"`
	Name          string         `json:"name"`
	IcURL         string         `json:"ic_url"`
	PayoutUSD     float64        `json:"payout_usd"`
	InappPytAmt   int            `json:"inapp_pyt_amt"`
	DescRaw       string         `json:"desc_raw"`
	TrkURL        string         `json:"trk_url"`
	OffType       string         `json:"off_type"`
	OS            string         `json:"os"`
	GeoTgtInclude datatypes.JSON `json:"geo_tgt_include"`
	GeoTgtExclude datatypes.JSON `json:"geo_tgt_exclude"`
	PubscaleUpdTs int64          `json:"pubscale_upd_ts"`
	Goals         datatypes.JSON `json:"goals"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

type UserOffer struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_offer" json:"user_id"`
	OfferID   uint      `gorm:"uniqueIndex:idx_user_offer" json:"offer_id"`
	Status    string    `json:"status"` // IN_PROGRESS, COMPLETED
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Transaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	WalletID  uint      `json:"wallet_id"`
	Amount    int       `json:"amount"`
	Type      string    `json:"type"` // CREDIT, DEBIT
	Reference string    `json:"reference"`
	Timestamp time.Time `gorm:"autoCreateTime" json:"timestamp"`
}

type CallbackLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	PubscaleToken string    `gorm:"uniqueIndex" json:"pubscale_token"`
	UserID        uint      `json:"user_id"`
	Value         float64   `json:"value"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
}
