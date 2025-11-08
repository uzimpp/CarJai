package integration

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"github.com/uzimpp/CarJai/backend/config"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/routes"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// testServer holds the test server and dependencies
type testServer struct {
	server      *httptest.Server
	db          *sql.DB
	services    *servicesContainer
	appConfig   *config.AppConfig
	userToken   string
	adminToken  string
	testUserID  int
	testAdminID int
}

// servicesContainer mirrors main.ServiceContainer
type servicesContainer struct {
	Admin       *services.AdminService
	User        *services.UserService
	Profile     *services.ProfileService
	Car         *services.CarService
	Favourite   *services.FavouriteService
	OCR         *services.OCRService
	Scraper     *services.ScraperService
	RecentViews *services.RecentViewsService
	Extraction  *services.ExtractionService
	UserJWT     *utils.JWTManager
	AdminJWT    *utils.JWTManager
}

// loadEnv loads environment variables
func loadEnv(t *testing.T) {
	envPath := "/app/.env"
	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		envPath = "../../.env"
	}
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: Could not load .env file: %v. Using system environment variables.", err)
	}
}

// setupTestServer creates a test HTTP server with real database
func setupTestServer(t *testing.T) *testServer {
	// Load environment variables
	loadEnv(t)

	// Setup database
	dbConfig := config.LoadDatabaseConfig()
	appConfig := config.LoadAppConfig()

	db, err := config.ConnectDatabase(dbConfig, appConfig)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize services (same as main.go)
	svcs := initializeTestServices(db, appConfig)

	// Setup routes
	mux := setupTestRoutes(svcs, appConfig, db)

	// Create test server
	server := httptest.NewServer(mux)

	return &testServer{
		server:    server,
		db:        db,
		services:  svcs,
		appConfig: appConfig,
	}
}

// initializeTestServices creates all services (same as main.go)
func initializeTestServices(db *sql.DB, appConfig *config.AppConfig) *servicesContainer {
	database := models.NewDatabase(db)

	// Create repositories
	adminRepo := models.NewAdminRepository(database)
	sessionRepo := models.NewSessionRepository(database)
	ipWhitelistRepo := models.NewIPWhitelistRepository(database)
	userRepo := models.NewUserRepository(database)
	userSessionRepo := models.NewUserSessionRepository(database)
	carRepo := models.NewCarRepository(database)
	carImageRepo := models.NewCarImageRepository(database)
	inspectionRepo := models.NewInspectionRepository(database)
	carColorRepo := models.NewCarColorRepository(database)
	carFuelRepo := models.NewCarFuelRepository(database)
	favouriteRepo := models.NewFavouriteRepository(database)

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
	userService.SetProfileService(profileService)

	// Create car service
	carService := services.NewCarService(
		carRepo,
		carImageRepo,
		inspectionRepo,
		carColorRepo,
		carFuelRepo,
	)

	// Create favourites service
	favouriteService := services.NewFavouriteService(favouriteRepo, carService)

	// Create scraper service
	scraperService := services.NewScraperService()

	// Create recent views service
	recentViewsService := services.NewRecentViewsService(db)

	// Create extraction service
	extractionService := services.NewExtractionService(db)

	return &servicesContainer{
		Admin: services.NewAdminService(
			adminRepo,
			sessionRepo,
			ipWhitelistRepo,
			adminJWTManager,
		),
		User:        userService,
		Profile:     profileService,
		Car:         carService,
		Favourite:   favouriteService,
		OCR:         services.NewOCRService(appConfig.AigenAPIKey),
		Scraper:     scraperService,
		RecentViews: recentViewsService,
		Extraction:  extractionService,
		UserJWT:     userJWTManager,
		AdminJWT:    adminJWTManager,
	}
}

// setupTestRoutes creates routes (same as main.go)
func setupTestRoutes(svcs *servicesContainer, appConfig *config.AppConfig, db *sql.DB) *http.ServeMux {
	adminPrefix := appConfig.AdminRoutePrefix
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from CarJai Backend!")
	})

	mux.Handle("/api/auth/",
		routes.UserAuthRoutes(svcs.User, svcs.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/profile/",
		routes.ProfileRoutes(svcs.Profile, svcs.User, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/sellers/",
		routes.PublicSellerRoutes(svcs.Profile, svcs.Car, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/cars",
		routes.CarRoutes(svcs.Car, svcs.User, svcs.Profile, svcs.OCR, svcs.Scraper, svcs.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/cars/",
		routes.CarRoutes(svcs.Car, svcs.User, svcs.Profile, svcs.OCR, svcs.Scraper, svcs.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/favorites",
		routes.FavouritesRoutes(svcs.Favourite, svcs.User, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/favorites/",
		routes.FavouritesRoutes(svcs.Favourite, svcs.User, appConfig.CORSAllowedOrigins))
	mux.Handle(adminPrefix+"/",
		routes.AdminRoutes(
			svcs.Admin,
			svcs.AdminJWT,
			svcs.Extraction,
			adminPrefix,
			appConfig.CORSAllowedOrigins,
			appConfig.AdminIPWhitelist,
		),
	)
	mux.Handle("/health/",
		routes.HealthRoutes(db, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/recent-views",
		routes.RecentViewsRoutes(svcs.RecentViews, svcs.Profile, svcs.User, svcs.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/recent-views/",
		routes.RecentViewsRoutes(svcs.RecentViews, svcs.Profile, svcs.User, svcs.UserJWT, appConfig.CORSAllowedOrigins))
	mux.Handle("/api/reference-data",
		routes.ReferenceRoutes(db, appConfig.CORSAllowedOrigins))

	return mux
}

// cleanupTestServer closes the test server and database
func (ts *testServer) cleanup() {
	if ts.server != nil {
		ts.server.Close()
	}
	if ts.db != nil {
		ts.db.Close()
	}
}

// TestHealthEndpoint tests the health check endpoint
func TestHealthEndpoint(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	resp, err := http.Get(ts.server.URL + "/health/")
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	var healthResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&healthResponse); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if healthResponse["status"] == nil {
		t.Error("Response should contain 'status' field")
	}
}

// TestUserAuthFlow tests complete user authentication flow
func TestUserAuthFlow(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Test Signup
	t.Run("Signup", func(t *testing.T) {
		// Use nanosecond modulo to ensure unique email/username while keeping username under 20 chars
		nanos := time.Now().UnixNano() % 1000000
		timestamp := nanos % 1000000 // Limit to 6 digits to keep username under 20 chars
		signupData := models.UserSignupRequest{
			Email:    fmt.Sprintf("test%d@example.com", nanos), // Use full nanos for email uniqueness
			Password: "password123",
			Username: fmt.Sprintf("test%d", timestamp), // "test" (4) + 6 digits = 10 chars, well under 20
			Name:     "Test User",
		}

		jsonData, _ := json.Marshal(signupData)
		resp, err := http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to make signup request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Errorf("Expected status 201, got %d", resp.StatusCode)
		}

		var signupResponse models.UserAuthResponse
		if err := json.NewDecoder(resp.Body).Decode(&signupResponse); err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}

		if !signupResponse.Success {
			t.Error("Signup should be successful")
		}

		// Extract token from cookie
		cookies := resp.Cookies()
		for _, cookie := range cookies {
			if cookie.Name == "jwt" {
				ts.userToken = cookie.Value
				break
			}
		}

		if ts.userToken == "" {
			t.Error("JWT token should be set in cookie")
		}
	})

	// Test Signin
	t.Run("Signin", func(t *testing.T) {
		// Use nanosecond modulo to ensure unique email/username while keeping username under 20 chars
		nanos := time.Now().UnixNano() % 1000000
		timestamp := nanos % 1000000 // Limit to 6 digits to keep username under 20 chars
		signinData := models.UserSigninRequest{
			EmailOrUsername: fmt.Sprintf("test%d@example.com", nanos), // Use full nanos for email uniqueness
			Password:        "password123",
		}

		// First signup
		signupData := models.UserSignupRequest{
			Email:    signinData.EmailOrUsername,
			Password: signinData.Password,
			Username: fmt.Sprintf("test%d", timestamp), // "test" (4) + 6 digits = 10 chars
			Name:     "Test User",
		}

		jsonData, _ := json.Marshal(signupData)
		http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))

		// Then signin
		jsonData, _ = json.Marshal(signinData)
		resp, err := http.Post(ts.server.URL+"/api/auth/signin", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to make signin request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	// Test Me endpoint
	t.Run("Me", func(t *testing.T) {
		if ts.userToken == "" {
			t.Skip("No token available, skipping Me test")
		}

		req, _ := http.NewRequest("GET", ts.server.URL+"/api/auth/me", nil)
		req.AddCookie(&http.Cookie{Name: "jwt", Value: ts.userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to make me request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})
}

// TestCarEndpoints tests car-related endpoints
func TestCarEndpoints(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Create a test user first
	// Use nanosecond modulo to ensure unique email/username while keeping username under 20 chars
	nanos := time.Now().UnixNano() % 1000000
	timestamp := nanos % 1000000 // Limit to 6 digits to keep username under 20 chars
	testEmail := fmt.Sprintf("seller%d@example.com", nanos) // Use full nanos for email uniqueness
	signupData := models.UserSignupRequest{
		Email:    testEmail,
		Password: "password123",
		Username: fmt.Sprintf("seller%d", timestamp), // "seller" (6) + 6 digits = 12 chars
		Name:     "Test Seller",
	}

	jsonData, _ := json.Marshal(signupData)
	resp, _ := http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))
	cookies := resp.Cookies()
	var userToken string
	for _, cookie := range cookies {
		if cookie.Name == "jwt" {
			userToken = cookie.Value
			break
		}
	}
	resp.Body.Close()

	// Create seller profile
	user, _ := ts.services.User.ValidateUserSession(userToken)
	if user != nil {
		ts.services.Profile.UpsertSeller(user.ID, models.SellerRequest{
			DisplayName: "Test Business",
		})
	}

	// Test Search Cars (public endpoint)
	t.Run("SearchCars", func(t *testing.T) {
		resp, err := http.Get(ts.server.URL + "/api/cars/search?q=toyota")
		if err != nil {
			t.Fatalf("Failed to make search request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	// Test Create Car (authenticated)
	t.Run("CreateCar", func(t *testing.T) {
		if userToken == "" {
			t.Skip("No token available")
		}

		req, _ := http.NewRequest("POST", ts.server.URL+"/api/cars", nil)
		req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to create car: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Errorf("Expected status 201, got %d", resp.StatusCode)
		}
	})
}

// TestReferenceDataEndpoint tests reference data endpoint
func TestReferenceDataEndpoint(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	resp, err := http.Get(ts.server.URL + "/api/reference-data")
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	var refResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&refResponse); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if refResponse["success"] != true {
		t.Error("Response should be successful")
	}
}

// TestAdminAuthFlow tests admin authentication flow
func TestAdminAuthFlow(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Test Admin Signin
	t.Run("AdminSignin", func(t *testing.T) {
		// Use admin credentials from environment
		adminUsername := os.Getenv("ADMIN_USERNAME")
		adminPassword := os.Getenv("ADMIN_PASSWORD")

		if adminUsername == "" || adminPassword == "" {
			t.Skip("Admin credentials not available")
		}

		signinData := map[string]string{
			"username": adminUsername,
			"password": adminPassword,
		}

		jsonData, _ := json.Marshal(signinData)
		resp, err := http.Post(ts.server.URL+"/admin/auth/signin", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to make admin signin request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}

		// Extract token from cookie
		cookies := resp.Cookies()
		for _, cookie := range cookies {
			if cookie.Name == "admin_jwt" {
				ts.adminToken = cookie.Value
				break
			}
		}

		if ts.adminToken == "" {
			t.Error("Admin JWT token should be set in cookie")
		}
	})
}

