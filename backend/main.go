package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/uzimpp/Carjai/backend/config"
	"github.com/uzimpp/Carjai/backend/models"
	"github.com/uzimpp/Carjai/backend/routes"
	"github.com/uzimpp/Carjai/backend/services"
	"github.com/uzimpp/Carjai/backend/utils"
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
	)

	// Setup health routes
	healthRouter := routes.HealthRoutes(db)

	// Setup main router
	mux := http.NewServeMux()

	// Root endpoint
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from CarJai Backend!")
	})

	// Mount admin routes
	mux.Handle(appConfig.AdminRoutePrefix+"/", http.StripPrefix(appConfig.AdminRoutePrefix, adminRouter))

	// Mount health routes
	mux.Handle("/", healthRouter)

	// Start server
	port := ":" + appConfig.Port
	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Admin routes available at: http://localhost%s%s\n", port, appConfig.AdminRoutePrefix)
	
	log.Fatal(http.ListenAndServe(port, mux))
}
