package config

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/uzimpp/CarJai/backend/utils"
)

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadDatabaseConfig loads database configuration from environment variables
func LoadDatabaseConfig() *DatabaseConfig {
	return &DatabaseConfig{
		Host:     utils.GetEnv("DB_HOST"),
		Port:     utils.GetEnv("DB_PORT"),
		User:     utils.GetEnv("DB_USER"),
		Password: utils.GetEnv("DB_PASSWORD"),
		DBName:   utils.GetEnv("DB_NAME"),
		SSLMode:  utils.GetEnv("DB_SSLMODE"),
	}
}

// GetConnectionString returns the database connection string
func (c *DatabaseConfig) GetConnectionString() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}

// ConnectDatabase establishes a connection to the database and initializes it
func ConnectDatabase(dbConfig *DatabaseConfig, appConfig *AppConfig) (*sql.DB, error) {
	connectionString := dbConfig.GetConnectionString()
	fmt.Printf("Connecting to database with: %s\n", connectionString)

	db, err := sql.Open("postgres", connectionString)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Set connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	// Wait for database to be ready and initialize admin user
	if err := waitForDatabaseAndInitialize(db, appConfig); err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	return db, nil
}

// waitForDatabaseAndInitialize waits for database to be ready and initializes admin user
func waitForDatabaseAndInitialize(db *sql.DB, appConfig *AppConfig) error {
	// Wait for database to be ready (tables exist)
	maxRetries := 10
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		// Check if admins table exists
		var tableExists bool
		err := db.QueryRow(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'admins'
			)
		`).Scan(&tableExists)

		if err == nil && tableExists {
			// Check if users table exists
			var usersTableExists bool
			err = db.QueryRow(`
				SELECT EXISTS (
					SELECT FROM information_schema.tables 
					WHERE table_schema = 'public' 
					AND table_name = 'users'
				)
			`).Scan(&usersTableExists)

			if err == nil && usersTableExists {
				// Database is ready, initialize admin user
				return initializeAdminUser(db, appConfig)
			}
		}

		if i < maxRetries-1 {
			log.Printf("Waiting for database schema to be ready... (attempt %d/%d)", i+1, maxRetries)
			time.Sleep(retryDelay)
		}
	}

	return fmt.Errorf("database schema not ready after %d attempts", maxRetries)
}

// initializeAdminUser creates or updates the admin user from environment variables
func initializeAdminUser(db *sql.DB, appConfig *AppConfig) error {
	// Check if admin user already exists
	var adminExists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM admins WHERE username = $1)", appConfig.AdminUsername).Scan(&adminExists)
	if err != nil {
		return fmt.Errorf("failed to check if admin exists: %w", err)
	}

	// Hash the password using bcrypt
	hashedPassword, err := utils.HashPassword(appConfig.AdminPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	if adminExists {
		// Update existing admin user
		_, err = db.Exec(`
			UPDATE admins 
			SET password_hash = $1, 
				name = $2,
				last_login_at = NULL
			WHERE username = $3
		`, hashedPassword, appConfig.AdminName, appConfig.AdminUsername)
		if err != nil {
			return fmt.Errorf("failed to update admin user: %w", err)
		}
		fmt.Printf("Admin user '%s' updated successfully\n", appConfig.AdminUsername)
	} else {
		// Create new admin user
		_, err = db.Exec(`
			INSERT INTO admins (username, password_hash, name, created_at)
			VALUES ($1, $2, $3, NOW())
		`, appConfig.AdminUsername, hashedPassword, appConfig.AdminName)
		if err != nil {
			return fmt.Errorf("failed to create admin user: %w", err)
		}
		fmt.Printf("Admin user '%s' created successfully\n", appConfig.AdminUsername)
	}

	// Initialize IP whitelist for the admin user
	return initializeIPWhitelist(db, appConfig)
}

// initializeIPWhitelist adds IP addresses from environment variables to whitelist for admin user
func initializeIPWhitelist(db *sql.DB, appConfig *AppConfig) error {
	// Get admin ID
	var adminID int
	err := db.QueryRow("SELECT id FROM admins WHERE username = $1", appConfig.AdminUsername).Scan(&adminID)
	if err != nil {
		return fmt.Errorf("failed to get admin ID: %w", err)
	}

	// Check if IP whitelist already has entries for this admin
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM admin_ip_whitelist WHERE admin_id = $1", adminID).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check IP whitelist: %w", err)
	}

	if count > 0 {
		fmt.Printf("IP whitelist already initialized for admin '%s'\n", appConfig.AdminUsername)
		return nil
	}

	// Parse IP addresses from environment variable
	if len(appConfig.AdminIPWhitelist) == 0 {
		fmt.Printf("Warning: ADMIN_IP_WHITELIST is empty, admin '%s' will not be able to login\n", appConfig.AdminUsername)
		return nil
	}

	addedCount := 0
	for _, ip := range appConfig.AdminIPWhitelist {
		ip = strings.TrimSpace(ip)
		if ip == "" {
			continue
		}

		_, err = db.Exec(`
			INSERT INTO admin_ip_whitelist (admin_id, ip_address, description)
			VALUES ($1, $2, $3)
		`, adminID, ip, "Environment configured IP")
		if err != nil {
			fmt.Printf("Warning: Failed to add IP %s to whitelist: %v\n", ip, err)
		} else {
			addedCount++
		}
	}

	fmt.Printf("IP whitelist initialized for admin '%s' with %d entries\n", appConfig.AdminUsername, addedCount)
	return nil
}
