package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// === CONFIGURATION SECTION ===
// Easy to modify settings for mock data generation

const (
	NUM_USERS_TO_CREATE = 60 
	DEMO_PASSWORD       = "Demo123456" 
	EMAIL_DOMAIN        = "carjai-demo.com"
	// (Seller:Buyer) -> 1/4 
	SELLER_BUYER_RATIO_DIVISOR = 4
)

// === END CONFIGURATION ===

func main() {
	// Load environment variables
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables from Docker")
	}

	// Connect to database
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "carjai")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Seed random
	rand.Seed(time.Now().UnixNano())

	// Step 1: Get reference data (Province Names for Buyers)
	provinceNames, err := getProvinceNames(db)
	if err != nil {
		log.Fatalf("Failed to get province names: %v", err)
	}
	log.Printf("✓ Loaded %d province names", len(provinceNames))

	// Step 2: Create demo users
	log.Printf("\nCreating %d demo users...", NUM_USERS_TO_CREATE)

	// Pre-hashed password for "Demo123456" (from seed_demo_cars.go)
	hashedPassword := "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"

	sellersCreated := 0
	buyersCreated := 0

	for i := 1; i <= NUM_USERS_TO_CREATE; i++ {
		// Define Role (1:3 ratio)
		isSeller := (i % SELLER_BUYER_RATIO_DIVISOR == 0)
		var role, username, name, email string

		// Random time
		daysAgo := rand.Intn(30)
		hoursAgo := rand.Intn(24)
		minutesAgo := rand.Intn(60)
		mockCreatedAt := time.Now().Add(-time.Hour * 24 * time.Duration(daysAgo)).Add(-time.Hour * time.Duration(hoursAgo)).Add(-time.Minute * time.Duration(minutesAgo))

		if isSeller {
			role = "seller"
			username = fmt.Sprintf("seller%d", i)
			name = fmt.Sprintf("Demo Seller %d", i)
			sellersCreated++
		} else {
			role = "buyer"
			username = fmt.Sprintf("buyer%d", i)
			name = fmt.Sprintf("Demo Buyer %d", i)
			buyersCreated++
		}
		email = fmt.Sprintf("%s@%s", username, EMAIL_DOMAIN)

		// craete User and Profile
		userID, err := createUser(db, email, username, name, hashedPassword, mockCreatedAt, isSeller, provinceNames)
		if err != nil {
			log.Printf("✗ Failed to create user %s (%s): %v", username, email, err)
			continue
		}
		log.Printf("  ✓ Created %s (ID: %d) with created_at: %s", role, userID, mockCreatedAt.Format(time.RFC3339))
	}

	log.Println("\n✅ Demo user seeding completed!")
	log.Printf("   Total Users: %d (Sellers: %d, Buyers: %d)", sellersCreated+buyersCreated, sellersCreated, buyersCreated)
}

// createUser in table `users` and profile in `sellers` or `buyers`
func createUser(db *sql.DB, email, username, name, hashedPassword string, createdAt time.Time, isSeller bool, provinceNames []string) (int, error) {
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback() 

	// Step 1: Insert into 'users'
	var userID int
	userQuery := `
		INSERT INTO users (email, password_hash, username, name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5)
		RETURNING id
	`
	err = tx.QueryRow(userQuery, email, hashedPassword, username, name, createdAt).Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("failed to create user entry: %w", err)
	}

	// Step 2: Insert into 'sellers' or 'buyers'
	if isSeller {
		_, err = tx.Exec(`
			INSERT INTO sellers (id, display_name, about)
			VALUES ($1, $2, $3)
		`, userID, name, "Demo seller account created by seeder")
		if err != nil {
			return 0, fmt.Errorf("failed to create seller profile: %w", err)
		}
	} else {
		province := randomItem(provinceNames)
		budgetMin := randomInt(200000, 800000)
		budgetMax := randomInt(budgetMin+100000, 2000000)

		_, err = tx.Exec(`
			INSERT INTO buyers (id, province, budget_min, budget_max)
			VALUES ($1, $2, $3, $4)
		`, userID, province, budgetMin, budgetMax)
		if err != nil {
			return 0, fmt.Errorf("failed to create buyer profile: %w", err)
		}
	}

	// Step 3: Commit Transaction
	return userID, tx.Commit()
}

// getProvinceNames ดึงชื่อจังหวัด (ภาษาไทย) จาก table 'provinces'
func getProvinceNames(db *sql.DB) ([]string, error) {
	rows, err := db.Query(`SELECT name_th FROM provinces WHERE name_th IS NOT NULL ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, nil
}

// === Helper functions (Copied from seed_demo_cars.go) ===

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func randomItem[T any](items []T) T {
	return items[rand.Intn(len(items))]
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min+1)
}