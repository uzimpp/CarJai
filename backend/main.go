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

	// Connect to database (handles all initialization)
	db, err := config.ConnectDatabase(dbConfig, appConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize services
	services := initializeServices(db, appConfig)

	// Setup routers
	routers := setupRoutes(services, appConfig, db)

	// Start maintenance service
	ctx := context.Background()
	go services.Maintenance.StartMaintenance(ctx, nil)

	// Start server
	port := ":" + appConfig.Port
	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Welcome to CarJai Backend\n")
	log.Fatal(http.ListenAndServe(port, routers))
}

// ServiceContainer holds all initialized services
type ServiceContainer struct {
	Admin       *services.AdminService
	User        *services.UserService
	Profile     *services.ProfileService
	Car         *services.CarService
	Maintenance *services.MaintenanceService
	OCR         *services.OCRService
	UserJWT     *utils.JWTManager
	AdminJWT    *utils.JWTManager
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
	carRepo := models.NewCarRepository(database)
	carImageRepo := models.NewCarImageRepository(database)

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

	// Create profile service
	profileService := services.NewProfileService(database)

	// Create user service
	userService := services.NewUserService(
		userRepo,
		userSessionRepo,
		userJWTManager,
	)

	// Set profile service on user service (to avoid circular dependency)
	userService.SetProfileService(profileService)

	// Create car service
	carService := services.NewCarService(carRepo, carImageRepo, profileService)

	return &ServiceContainer{
		Admin: services.NewAdminService(
			adminRepo,
			sessionRepo,
			ipWhitelistRepo,
			adminJWTManager,
		),
		User:    userService,
		Profile: profileService,
		Car:     carService,
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

func setupRoutes(services *ServiceContainer, appConfig *config.AppConfig, db *sql.DB) *http.ServeMux {
	mux := http.NewServeMux()

	// Root endpoint (only for exact match)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from CarJai Backend!")
	})
	// Mount all routes
	mux.Handle("/api/auth/",
		routes.UserAuthRoutes(services.User, services.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/profile/",
		routes.ProfileRoutes(services.Profile, services.User, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/sellers/",
		routes.PublicSellerRoutes(services.Profile, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/cars",
		routes.CarRoutes(services.Car, services.User, services.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/cars/",
		routes.CarRoutes(services.Car, services.User, services.UserJWT, appConfig.CORSAllowedOrigins))
	adminPrefix := appConfig.AdminRoutePrefix
	mux.Handle(adminPrefix+"/",
		routes.AdminRoutes(services.Admin, services.AdminJWT, adminPrefix, appConfig.CORSAllowedOrigins, appConfig.AdminIPWhitelist))
	mux.Handle("/api/ocr/",
		routes.OCRRoutes(services.OCR, services.User, services.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/health/",
		routes.HealthRoutes(db, appConfig.CORSAllowedOrigins))

	return mux
}
