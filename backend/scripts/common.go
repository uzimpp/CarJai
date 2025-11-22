package main

import (
	"database/sql"
	"log"
	"math/rand"
	"time"

	"github.com/uzimpp/CarJai/backend/config"
)

// Shared constants for seeding
const (
	EMAIL_DOMAIN = "demo.com"

	DEMO_SELLER_EMAIL           = "seller@demo.com"
	DEMO_SELLER_USERNAME        = "seller"
	DEMO_SELLER_NAME            = "Demo Seller"
	DEMO_SELLER_ABOUT           = "Demo seller for testing"
	DEMO_SELLER_MAP_LINK        = "https://maps.google.com"
	DEMO_SELLER_CONTACT_TYPE    = "phone"
	DEMO_SELLER_CONTACT_VALUE   = "0812345678"
	DEMO_SELLER_CONTACT_LABEL   = "Call"
	DEMO_SELLER_CONTACT_TYPE_2  = "line"
	DEMO_SELLER_CONTACT_VALUE_2 = "@democar"
	DEMO_SELLER_CONTACT_LABEL_2 = "LINE"
	DEMO_BUYER_EMAIL            = "buyer@demo.com"
	DEMO_BUYER_USERNAME         = "buyer"
	DEMO_BUYER_NAME             = "Demo Buyer"
	DEMO_BUYER_PROVINCE         = "Bangkok"
	DEMO_BUYER_BUDGET_MIN       = 200000
	DEMO_BUYER_BUDGET_MAX       = 800000
	DEMO_PASSWORD               = "Demo1234"
)

// connectDB connects to the database using the existing config package
// This ensures we use the same connection logic as the main application
func connectDB() (*sql.DB, error) {
	// Load database configuration using the same method as main application
	dbConfig := config.LoadDatabaseConfig()

	// We don't need admin initialization for seeding, so we connect directly
	connectionString := dbConfig.GetConnectionString()
	log.Printf("Connecting to database...")

	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	// Set connection pool settings (same as main app)
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	log.Println("Connected to database successfully")
	return db, nil
}

// Helper functions for random data generation

func randomItem[T any](items []T) T {
	if len(items) == 0 {
		var zero T
		return zero
	}
	return items[rand.Intn(len(items))]
}

func randomItems[T any](items []T, count int) []T {
	if count >= len(items) {
		return items
	}

	// Shuffle and take first N
	shuffled := make([]T, len(items))
	copy(shuffled, items)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	return shuffled[:count]
}

func randomInt(min, max int) int {
	if min >= max {
		return min
	}
	return min + rand.Intn(max-min+1)
}

func randomKey(m map[string][]string) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	if len(keys) == 0 {
		return ""
	}
	return keys[rand.Intn(len(keys))]
}

// randomTimeInRange generates a random time within the last N days
func randomTimeInRange(days int) time.Time {
	daysAgo := rand.Intn(days)
	hoursAgo := rand.Intn(24)
	minutesAgo := rand.Intn(60)
	return time.Now().Add(-time.Hour * 24 * time.Duration(daysAgo)).
		Add(-time.Hour * time.Duration(hoursAgo)).
		Add(-time.Minute * time.Duration(minutesAgo))
}

// getBuyers gets all buyer IDs (users who have a buyer profile)
func getBuyers(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id FROM buyers ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var buyers []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		buyers = append(buyers, id)
	}
	return buyers, nil
}
