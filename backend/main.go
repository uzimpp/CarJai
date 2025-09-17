package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
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
	userRepo := models.NewUserRepository(database)
	userSessionRepo := models.NewUserSessionRepository(database)

	// Create JWT manager
	jwtManager := utils.NewJWTManager(
		appConfig.JWTSecret,
		time.Duration(appConfig.JWTExpiration)*time.Hour,
		appConfig.JWTIssuer,
	)

	// Create admin service
	adminService := services.NewAdminService(
		adminRepo,
		sessionRepo,
		ipWhitelistRepo,
		jwtManager,
	)

	// Create user service
	userService := services.NewUserService(
		userRepo,
		userSessionRepo,
		jwtManager,
		"", // UserRoutePrefix removed as it's not defined in AppConfig
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

	// Parse allowed IPs from config
	allowedIPs := []string{}
	if appConfig.AdminIPWhitelist != "" {
		// Split comma-separated IPs and trim whitespace
		ips := strings.Split(appConfig.AdminIPWhitelist, ",")
		for _, ip := range ips {
			allowedIPs = append(allowedIPs, strings.TrimSpace(ip))
		}
	} else {
		log.Fatal("ADMIN_IP_WHITELIST environment variable is required for security")
	}

	// Setup admin routes
	adminRouter := routes.AdminRoutes(
		adminService,
		jwtManager,
		appConfig.AdminRoutePrefix,
		appConfig.CORSAllowedOrigins,
		allowedIPs,
	)

	// Setup health routes
	healthRouter := routes.HealthRoutes(db, appConfig.CORSAllowedOrigins)

	// Setup user authentication routes
	userAuthRouter := routes.UserAuthRoutes(userService, appConfig.CORSAllowedOrigins)

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

	// Mount user auth routes
	mux.Handle("/api/", userAuthRouter)

	// Mount health routes
	mux.Handle("/health", healthRouter)

	// Start server
	port := ":" + appConfig.Port
	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Welcome to CarJai Backend\n")
	log.Fatal(http.ListenAndServe(port, mux))
}

// waitForDatabaseAndInitialize waits for database to be ready and initializes admin user
func waitForDatabaseAndInitialize(db *sql.DB, appConfig *config.AppConfig) error {
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
	return initializeIPWhitelist(db, appConfig)
}

// initializeIPWhitelist adds IP addresses from environment variables to whitelist for admin user
func initializeIPWhitelist(db *sql.DB, appConfig *config.AppConfig) error {
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
	if appConfig.AdminIPWhitelist == "" {
		fmt.Printf("Warning: ADMIN_IP_WHITELIST is empty, admin '%s' will not be able to login\n", appConfig.AdminUsername)
		return nil
	}

	// Split comma-separated IPs and trim whitespace
	ips := strings.Split(appConfig.AdminIPWhitelist, ",")
	addedCount := 0

	for _, ip := range ips {
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
