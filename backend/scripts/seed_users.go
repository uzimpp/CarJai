package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/uzimpp/CarJai/backend/utils"
)

const (
	NUM_USERS_TO_CREATE        = 60
	SELLER_BUYER_RATIO_DIVISOR = 4 // 1 seller per 4 users (1:4 ratio)
)

// seedUsersData seeds users, sellers, and buyers
func seedUsersData(db *sql.DB) error {
	// Get reference data (Province Names for Buyers)
	provinceNames, err := getProvinceNames(db)
	if err != nil {
		return fmt.Errorf("failed to get province names: %w", err)
	}
	log.Printf("✓ Loaded %d province names", len(provinceNames))

	// Hash password once for all users (using actual hashing function)
	hashedPassword, err := utils.HashPassword(DEMO_PASSWORD)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	log.Printf("Creating %d demo users...", NUM_USERS_TO_CREATE)

	sellersCreated := 0
	buyersCreated := 0

	for i := 1; i <= NUM_USERS_TO_CREATE; i++ {
		// Define Role (1:3 ratio)
		isSeller := (i%SELLER_BUYER_RATIO_DIVISOR == 0)
		var role, username, name, email string

		// Random time within last 30 days
		mockCreatedAt := randomTimeInRange(30)

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

		// Create User and Profile
		userID, err := createUser(db, email, username, name, hashedPassword, mockCreatedAt, isSeller, provinceNames)
		if err != nil {
			log.Printf("✗ Failed to create user %s (%s): %v", username, email, err)
			continue
		}
		log.Printf("  ✓ Created %s (ID: %d) with created_at: %s", role, userID, mockCreatedAt.Format(time.RFC3339))
	}

	log.Printf("Total Users: %d (Sellers: %d, Buyers: %d)", sellersCreated+buyersCreated, sellersCreated, buyersCreated)
	return nil
}

// createUser creates a user in table `users` and profile in `sellers` or `buyers`
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
		budgetMin := randomInt(DEMO_BUYER_BUDGET_MIN, DEMO_BUYER_BUDGET_MAX)
		budgetMax := randomInt(budgetMin+100000, 2000000)

		_, err = tx.Exec(`
			INSERT INTO buyers (id, province, budget_min, budget_max)
			VALUES ($1, $2, $3, $4)
		`, userID, province, budgetMin, budgetMax)
		if err != nil {
			return 0, fmt.Errorf("failed to create buyer profile: %w", err)
		}
	}

	// Step 3: Insert a fake session for this user
	sessionQuery := `
		INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	fakeToken := fmt.Sprintf("demo-session-token-%d-%s", userID, createdAt.Format(time.RFC3339Nano))
	expiresAt := time.Now().Add(time.Hour * 24 * 30)

	_, err = tx.Exec(sessionQuery, userID, fakeToken, "127.0.0.1", "demo-seeder", expiresAt, createdAt)
	if err != nil {
		return 0, fmt.Errorf("failed to create demo session: %w", err)
	}

	// Step 4: Commit Transaction
	return userID, tx.Commit()
}

// getProvinceNames gets province names from table 'provinces'
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
