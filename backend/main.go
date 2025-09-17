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

	log.Printf("AIGEN API Key loaded: [%s]", appConfig.AigenAPIKey)
	
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

	// Initialize services
	services := initializeServices(db, appConfig)

	// Parse CORS origins
	allowedOrigins := parseCORSOrigins(appConfig.CORSAllowedOrigins)

	// Setup routers
	routers := setupRouters(services, appConfig, allowedOrigins)

	// Start maintenance service
	ctx := context.Background()
	go services.Maintenance.StartMaintenance(ctx, nil)

	// Setup main router
	mux := setupMainRouter(routers, appConfig, db)

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

// ServiceContainer holds all initialized services
type ServiceContainer struct {
	Admin       *services.AdminService
	User        *services.UserService
	Maintenance *services.MaintenanceService
	OCR         *services.OCRService
	UserJWT     *utils.JWTManager
	AdminJWT    *utils.JWTManager
}

// RouterContainer holds all initialized routers
type RouterContainer struct {
	Admin     *http.ServeMux
	UserAuth  *http.ServeMux
	Health    *http.ServeMux
	OCR       http.Handler
}

// initializeServices creates and returns all service instances
func initializeServices(db *sql.DB, appConfig *config.AppConfig) *ServiceContainer {
	// Create database instance
	database := models.NewDatabase(db)

	// Create repositories
	adminRepo := models.NewAdminRepository(database)
	sessionRepo := models.NewSessionRepository(database)
	ipWhitelistRepo := models.NewIPWhitelistRepository(database)
	userRepo := models.NewUserRepository(database)
	userSessionRepo := models.NewUserSessionRepository(database)

	// Create JWT managers
	userJWTManager := utils.NewJWTManager(
		appConfig.UserJWTSecret,
		time.Duration(appConfig.UserJWTExpiration)*time.Hour,
		appConfig.UserJWTIssuer,
	)

	adminJWTManager := utils.NewJWTManager(
		appConfig.AdminJWTSecret,
		time.Duration(appConfig.AdminJWTExpiration)*time.Hour,
		appConfig.AdminJWTIssuer,
	)

	return &ServiceContainer{
		Admin: services.NewAdminService(
			adminRepo,
			sessionRepo,
			ipWhitelistRepo,
			adminJWTManager,
		),
		User: services.NewUserService(
			userRepo,
			userSessionRepo,
			userJWTManager,
		),
		Maintenance: services.NewMaintenanceService(
			adminRepo,
			sessionRepo,
			ipWhitelistRepo,
			utils.AppLogger,
		),
		OCR:      services.NewOCRService(appConfig.AigenAPIKey),
		UserJWT:  userJWTManager,
		AdminJWT: adminJWTManager,
	}
}

// parseCORSOrigins parses comma-separated CORS origins into a slice
func parseCORSOrigins(corsOrigins string) []string {
	originsList := strings.Split(corsOrigins, ",")
	allowedOrigins := make([]string, 0, len(originsList))
	for _, origin := range originsList {
		trimmedOrigin := strings.TrimSpace(origin)
		if trimmedOrigin != "" {
			allowedOrigins = append(allowedOrigins, trimmedOrigin)
		}
	}
	return allowedOrigins
}

// setupRouters creates and returns all router instances
func setupRouters(services *ServiceContainer, appConfig *config.AppConfig, allowedOrigins []string) *RouterContainer {
	// Parse allowed IPs from config
	allowedIPs := parseAllowedIPs(appConfig.AdminIPWhitelist)

	return &RouterContainer{
		Admin: routes.AdminRoutes(
			services.Admin,
			services.AdminJWT,
			appConfig.AdminRoutePrefix,
			appConfig.CORSAllowedOrigins,
			allowedIPs,
		),
		UserAuth: routes.UserAuthRoutes(
			services.User,
			services.UserJWT,
			appConfig.CORSAllowedOrigins,
		),
		Health: nil, // Will be set up in setupMainRouter with db
		OCR: routes.OCRRoutes(
			services.OCR,
			allowedOrigins,
		),
	}
}

// parseAllowedIPs parses comma-separated IP addresses into a slice
func parseAllowedIPs(ipWhitelist string) []string {
	if ipWhitelist == "" {
		log.Fatal("ADMIN_IP_WHITELIST environment variable is required for security")
	}

	ips := strings.Split(ipWhitelist, ",")
	allowedIPs := make([]string, 0, len(ips))
	for _, ip := range ips {
		trimmedIP := strings.TrimSpace(ip)
		if trimmedIP != "" {
			allowedIPs = append(allowedIPs, trimmedIP)
		}
	}
	return allowedIPs
}

// setupMainRouter creates and configures the main HTTP router
func setupMainRouter(routers *RouterContainer, appConfig *config.AppConfig, db *sql.DB) *http.ServeMux {
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
	mux.Handle(appConfig.AdminRoutePrefix+"/", http.StripPrefix(appConfig.AdminRoutePrefix, routers.Admin))

	// Mount user auth routes
	mux.Handle("/api/", routers.UserAuth)

	// Mount health routes
	healthRouter := routes.HealthRoutes(db, appConfig.CORSAllowedOrigins)
	mux.Handle("/health", healthRouter)

	// Mount OCR routes
	apiPrefix := "/api"
	mux.Handle(apiPrefix+"/ocr/", http.StripPrefix(apiPrefix+"/ocr", routers.OCR))

	return mux
}
