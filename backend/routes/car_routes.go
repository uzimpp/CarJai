package routes

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// CarRoutes sets up all car-related routes
func CarRoutes(
	carService *services.CarService,
	userService *services.UserService,
	ocrService *services.OCRService,
	scraperService *services.ScraperService,
	userJWT *utils.JWTManager,
	corsOrigins []string,
) *http.ServeMux {
	// Create handler instance
	carHandler := handlers.NewCarHandler(carService, userService, ocrService, scraperService)

	// Create auth middleware
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Create router
	router := http.NewServeMux()

	// Public search endpoint (GET)
	router.HandleFunc("/api/cars/search",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						carHandler.SearchCars,
					),
				),
			),
		),
	)

	// Get current user's cars (GET) - authenticated
	router.HandleFunc("/api/cars/my",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							carHandler.GetMyCars,
						),
					),
				),
			),
		),
	)

	// Upload vehicle registration book (POST) - authenticated
	router.HandleFunc("/api/cars/book",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							carHandler.UploadBook,
						),
					),
				),
			),
		),
	)

	// Image management by image ID (GET public, DELETE authenticated)
	router.HandleFunc("/api/cars/images/",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							carHandler.HandleImageByID(w, r, authMiddleware)
						},
					),
				),
			),
		),
	)

	// Base /api/cars endpoint (POST) - create car - authenticated
	router.HandleFunc("/api/cars",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							carHandler.CreateCar,
						),
					),
				),
			),
		),
	)

	// Car-specific routes with dynamic ID
	router.HandleFunc("/api/cars/",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							handleCarRoutes(w, r, carHandler, authMiddleware)
						},
					),
				),
			),
		),
	)

	return router
}

// handleCarRoutes handles all /api/cars/{id} and /api/cars/{id}/* routes
func handleCarRoutes(
	w http.ResponseWriter,
	r *http.Request,
	handler *handlers.CarHandler,
	authMiddleware *middleware.UserAuthMiddleware,
) {
	path := r.URL.Path

	// /api/cars/{id}/images - Upload images (authenticated)
	if strings.Contains(path, "/images") && !strings.Contains(path, "/images/order") {
		authMiddleware.RequireAuth(handler.UploadCarImages)(w, r)
		return
	}

	// /api/cars/{id}/images/order - Reorder images (authenticated)
	if strings.HasSuffix(path, "/images/order") {
		authMiddleware.RequireAuth(handler.ReorderImages)(w, r)
		return
	}

	// /api/cars/{id}/status - Update status (authenticated)
	if strings.HasSuffix(path, "/status") {
		authMiddleware.RequireAuth(handler.UpdateStatus)(w, r)
		return
	}

	// /api/cars/{id}/inspection - Upload inspection (authenticated)
	if strings.HasSuffix(path, "/inspection") {
		authMiddleware.RequireAuth(handler.UploadInspection)(w, r)
		return
	}

	// /api/cars/{id}/draft - Auto-save draft (authenticated)
	if strings.HasSuffix(path, "/draft") {
		authMiddleware.RequireAuth(handler.AutoSaveDraft)(w, r)
		return
	}

	// /api/cars/{id}/review - Review publish readiness (authenticated)
	if strings.HasSuffix(path, "/review") {
		authMiddleware.RequireAuth(handler.Review)(w, r)
		return
	}

	// General car CRUD: /api/cars/{id}
	idPart := strings.TrimPrefix(path, "/api/cars/")
	if !strings.Contains(idPart, "/") || idPart == "" {
		// Route to appropriate handler based on auth requirements
		switch r.Method {
		case http.MethodGet:
			// Public: Get single car
			handler.GetCar(w, r)
		case http.MethodPut, http.MethodPatch, http.MethodDelete:
			// Authenticated: Update/Delete car
			authMiddleware.RequireAuth(handler.HandleCarCRUD)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	http.Error(w, "Not found", http.StatusNotFound)
}
