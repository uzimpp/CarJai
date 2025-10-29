package services_test

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq" // PostgreSQL driver

	"github.com/uzimpp/CarJai/backend/services" // Import your services package
)

// --- Database Setup Functions (Keep as is) ---

// loadEnv loads environment variables from .env file (expected at /app/.env inside container).
func loadEnv(t *testing.T) {
	envPath := "/app/.env" // Absolute path inside the container where .env is mounted
	log.Printf("Attempting to load .env file from explicit path: %s", envPath)
	err := godotenv.Load(envPath) // Load using the explicit path
	if err != nil {
		// Log warning but continue
		log.Printf("Warning: Could not load .env file from '%s': %v. Relying on system environment variables.", envPath, err)
	} else {
		log.Println(".env file loaded successfully.")
	}
}

// getTestDBConnectionString constructs the connection string from environment variables.
func getTestDBConnectionString() string {
	// Use values appropriate for connecting *within* the Docker network
	host := os.Getenv("DB_HOST") // Should be "database"
	port := os.Getenv("DB_PORT") // Should be "5432"
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")

	// Basic validation
	if host == "" || port == "" || user == "" || password == "" || dbname == "" {
		log.Println("ERROR: Missing required database environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)")
		return "" // Return empty string to indicate failure
	}
	if sslmode == "" {
		sslmode = "disable" // Default if not set
	}

	// Use keyword/value format, matching database.go
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	// Log the connection string (masking password for safety)
	maskedConnStr := fmt.Sprintf("host=%s port=%s user=%s password=*** dbname=%s sslmode=%s",
		host, port, user, dbname, sslmode)
	log.Printf("Using connection string inside Docker for testing: %s", maskedConnStr)

	return connStr
}

// setupTestDB connects to the database after loading env vars.
func setupTestDB(t *testing.T) *sql.DB {
	loadEnv(t) // Load .env first
	connStr := getTestDBConnectionString()
	if connStr == "" { // Check if getTestDBConnectionString failed
		t.Fatalf("Failed to construct database connection string due to missing environment variables.")
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		t.Fatalf("Failed to open database connection: %v", err)
	}

	// Ping with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second) // Increased timeout for potentially slower CI environments
	defer cancel()
	err = db.PingContext(ctx)
	if err != nil {
		db.Close()
		// Provide more context in the error message
		t.Fatalf("Failed to ping database (%s:%s): %v", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), err)
	}

	log.Println("Successfully connected to database.")
	return db
}

// --- Test Function (Refactored) ---

// TestExtractionService_ImportMarketPricesFromPDF_POCFile runs the POC import process
// using the refactored ExtractionService.
// This acts as an integration test.
func TestExtractionService_ImportMarketPricesFromPDF_POCFile(t *testing.T) {
	// Setup Database Connection
	db := setupTestDB(t)
	defer func() {
		log.Println("Closing database connection...")
		errClose := db.Close()
		if errClose != nil {
			t.Errorf("Error closing database connection: %v", errClose)
		} else {
			log.Println("Database connection closed.")
		}
	}()

	// Create Service Instance
	extractionService := services.NewExtractionService(db)

	// Define PDF Path (relative within the container's /app context)
	// Assumes the test file is in /app/services and PDF is in /app/tests
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("Could not get caller information")
	}
	currentDir := filepath.Dir(currentFile)                 // Should be /app/services
	pdfPath := filepath.Join(currentDir, "..", "tests", "price2568.pdf") // Path -> /app/tests/price2568.pdf
	pdfPath = filepath.Clean(pdfPath)

	log.Printf("Running market price import test with PDF path: %s", pdfPath)

	// Execute the Service Method
	ctx := context.Background() // Use a background context for the import process
	inserted, updated, err := extractionService.ImportMarketPricesFromPDF(ctx, pdfPath)

	// --- Assertions ---
	if err != nil {
		t.Fatalf("ImportMarketPricesFromPDF failed: %v", err) // Fail fast if the import itself errors
	}

	// Log results
	t.Logf("Import completed successfully. Inserted: %d, Updated: %d", inserted, updated)

	// Basic Verification (Optional but recommended)
	// Check if the total count seems reasonable (should be > 0 if PDF had data)
	if inserted+updated == 0 {
		t.Error("Verification failed: Expected some records to be inserted or updated, but counts are zero.")
	}

	// You could add more specific checks here, e.g., query a known record
	var brandCheck string
	checkCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	errCheck := db.QueryRowContext(checkCtx, "SELECT brand FROM market_price WHERE model_trim = 'AION ES' LIMIT 1").Scan(&brandCheck)
	if errCheck != nil {
		t.Errorf("Verification query failed: %v", errCheck)
	} else if brandCheck != "AION" {
		t.Errorf("Verification failed: Expected brand 'AION' for model 'AION ES', but got '%s'", brandCheck)
	} else {
		t.Logf("Verification query passed for 'AION ES'.")
	}

	// Check total count again (could be slightly different from inserted if table wasn't empty)
	var finalCount int64
	countCtx, cancelCount := context.WithTimeout(ctx, 5*time.Second)
	defer cancelCount()
	errCount := db.QueryRowContext(countCtx, "SELECT COUNT(*) FROM market_price").Scan(&finalCount)
	if errCount != nil {
		t.Errorf("Failed to query final count from market_price: %v", errCount)
	} else {
		t.Logf("Final record count in market_price table: %d", finalCount)
		// Optionally assert finalCount >= inserted
		if finalCount < int64(inserted) {
			t.Errorf("Verification warning: Final count (%d) is less than inserted count (%d).", finalCount, inserted)
		}
	}
}