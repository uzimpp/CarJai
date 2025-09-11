package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/uzimpp/CarJai/backend/config"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/routes"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

func main() {
	// Load configuration
	appConfig := config.LoadAppConfig()
	dbConfig := config.LoadDatabaseConfig()

	// Connect to database
	db, err := config.ConnectDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Wait for database to be ready and initialize schema if needed
	if err := waitForDatabaseAndInitialize(db, appConfig); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create database instance
	database := models.NewDatabase(db)

	// Create repositories
	adminRepo := models.NewAdminRepository(database)
	sessionRepo := models.NewSessionRepository(database)
	ipWhitelistRepo := models.NewIPWhitelistRepository(database)

	// Create JWT manager
	jwtManager := utils.NewJWTManager(
		appConfig.JWTSecret,
		time.Duration(appConfig.JWTExpiration)*time.Hour,
	)

	// Create admin service
	adminService := services.NewAdminService(
		adminRepo,
		sessionRepo,
		ipWhitelistRepo,
		jwtManager,
	)

	// Create maintenance service
	maintenanceService := services.NewMaintenanceService(
		adminRepo,
		sessionRepo,
		ipWhitelistRepo,
		utils.AppLogger,
	)

	// Start maintenance service
	ctx := context.Background()
	go maintenanceService.StartMaintenance(ctx, nil)

	// Setup admin routes
	adminRouter := routes.AdminRoutes(
		adminService,
		jwtManager,
		appConfig.AdminRoutePrefix,
		appConfig.CORSAllowedOrigins,
	)

	// Setup health routes
	healthRouter := routes.HealthRoutes(db, appConfig.CORSAllowedOrigins)

	// Setup main router
	mux := http.NewServeMux()

	// Root endpoint (only for exact match)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			fmt.Fprintf(w, "Hello from CarJai Backend!")
		} else {
			http.NotFound(w, r)
		}
	})

	// Mount admin routes
	mux.Handle(appConfig.AdminRoutePrefix+"/", http.StripPrefix(appConfig.AdminRoutePrefix, adminRouter))

	// Mount health routes
	mux.Handle("/health", healthRouter)

	// Start server
	port := ":" + appConfig.Port
	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Admin routes available at: http://localhost%s%s\n", port, appConfig.AdminRoutePrefix)
	
	log.Fatal(http.ListenAndServe(port, mux))
}

// waitForDatabaseAndInitialize waits for database to be ready and initializes admin user
func waitForDatabaseAndInitialize(db *sql.DB, appConfig *config.AppConfig) error {
	// Wait for database to be ready (tables exist)
	maxRetries := 30
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
			// Database is ready, initialize admin user
			return initializeAdminUser(db, appConfig)
		}
		
		if i < maxRetries-1 {
			log.Printf("Waiting for database schema to be ready... (attempt %d/%d)", i+1, maxRetries)
			time.Sleep(retryDelay)
		}
	}
	
	return fmt.Errorf("database schema not ready after %d attempts", maxRetries)
}

// initializeAdminUser creates or updates the admin user from environment variables
func initializeAdminUser(db *sql.DB, appConfig *config.AppConfig) error {
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
	return initializeIPWhitelist(db, appConfig.AdminUsername)
}

// initializeIPWhitelist adds default IP addresses to whitelist for admin user
func initializeIPWhitelist(db *sql.DB, username string) error {
	// Get admin ID
	var adminID int
	err := db.QueryRow("SELECT id FROM admins WHERE username = $1", username).Scan(&adminID)
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
		fmt.Printf("IP whitelist already initialized for admin '%s'\n", username)
		return nil
	}

	// Add default IP addresses
	defaultIPs := []struct {
		ip          string
		description string
	}{
		{"127.0.0.1/32", "Localhost IPv4"},
		{"::1/128", "Localhost IPv6"},
		{"172.19.0.1/32", "Docker host"},
		{"172.16.0.0/12", "Docker bridge network"},
		{"192.168.1.0/24", "Local network"},
		{"10.0.0.0/8", "Private network"},
	}

	for _, ip := range defaultIPs {
		_, err = db.Exec(`
			INSERT INTO admin_ip_whitelist (admin_id, ip_address, description, created_at)
			VALUES ($1, $2, $3, NOW())
		`, adminID, ip.ip, ip.description)
		if err != nil {
			log.Printf("Warning: Failed to add IP %s to whitelist: %v", ip.ip, err)
		}
	}

	fmt.Printf("IP whitelist initialized for admin '%s'\n", username)
	return nil
}
