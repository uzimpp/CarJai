package services_test

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath" // <--- Ensure filepath is imported
	"runtime"       // <--- Ensure runtime is imported
	"testing"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"github.com/uzimpp/CarJai/backend/services"
)

// --- ส่วนตั้งค่า Database Connection (แก้ไข loadEnv) ---

// loadEnv loads environment variables from .env file located at the project root.
func loadEnv(t *testing.T) {
    envPath := "/app/.env" // <--- Specify the absolute path inside the container
    log.Printf("Attempting to load .env file from explicit path: %s", envPath)
    err := godotenv.Load(envPath) // <--- Load using the explicit path
    if err != nil {
        // Log warning but continue (might use system env vars if any)
        log.Printf("Warning: Could not load .env file from '%s': %v. Relying on system environment variables.", envPath, err)
    } else {
        log.Println(".env file loaded successfully.")
    }
}

// getTestDBConnectionString constructs the connection string from environment variables.
// backend/services/extraction_service_test.go

func getTestDBConnectionString() string {
    // --- ใช้ค่าจาก .env เหมือน main.go ---
    host := os.Getenv("DB_HOST") // Should be "database"
    port := os.Getenv("DB_PORT") // Should be "5432"
    // ------------------------------------
    user := os.Getenv("DB_USER")
    password := os.Getenv("DB_PASSWORD")
    dbname := os.Getenv("DB_NAME")
    sslmode := os.Getenv("DB_SSLMODE")

    // *** ลบ DEBUG Log Password ออก ***
    // log.Printf("[DEBUG] Password read from env: '%s'", password)

    if host == "" || port == "" || user == "" || password == "" || dbname == "" { // Check password here too
        log.Println("ERROR: Missing required database environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)")
        return ""
    }
    if sslmode == "" {
        sslmode = "disable"
    }

    // --- ใช้ format เดียวกับ database.go ---
    connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        host, port, user, password, dbname, sslmode)
    // ---------------------------------------

    maskedConnStr := fmt.Sprintf("host=%s port=%s user=%s password=*** dbname=%s sslmode=%s",
        host, port, user, dbname, sslmode)
    log.Printf("Using connection string inside Docker for testing: %s", maskedConnStr)

    return connStr
}

// setupTestDB connects to the test database after loading env vars.
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err = db.PingContext(ctx)
	if err != nil {
		db.Close()
		t.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Successfully connected to database.")
	return db
}

// --- สิ้นสุดส่วนตั้งค่า Database ---


// TestExtractAndPrintMarketPricesPOC (ส่วนที่เหลือเหมือนเดิม)
func TestExtractAndPrintMarketPricesPOC(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	_, currentFile, _, ok := runtime.Caller(0)
	if !ok { t.Fatal("Could not get caller information") }
	currentDir := filepath.Dir(currentFile)
	// Path from services/ -> backend/ -> CarJai/ -> tests/
	pdfPath := filepath.Join(currentDir, "..", "tests", "price2568.pdf")
	pdfPath = filepath.Clean(pdfPath)

	log.Printf("Running POC extraction with PDF path: %s", pdfPath)

	ctx := context.Background()
	err := services.ExtractAndPrintMarketPricesPOC(ctx, db, pdfPath)
	if err != nil {
		t.Fatalf("POC extraction or DB operation failed: %v", err)
	}

	var count int
	checkCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	errCheck := db.QueryRowContext(checkCtx, "SELECT COUNT(*) FROM market_price").Scan(&count)
	if errCheck != nil {
		t.Errorf("Failed to query count from market_price after POC: %v", errCheck)
	} else {
		t.Logf("POC executed successfully. Found %d records in market_price table.", count)
	}
}