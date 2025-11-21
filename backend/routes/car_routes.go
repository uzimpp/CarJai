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
	profileService *services.ProfileService,
	ocrService *services.OCRService,
	scraperService *services.ScraperService,
	userJWT *utils.JWTManager,
	corsOrigins []string,
) *http.ServeMux {
	// Create handler instance
	carHandler := handlers.NewCarHandler(carService, userService, profileService, ocrService, scraperService)

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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodGet {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							carHandler.SearchCars(w, r)
						},
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
							func(w http.ResponseWriter, r *http.Request) {
								if r.Method != http.MethodGet {
									utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
									return
								}
								carHandler.GetMyCars(w, r)
							},
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
							func(w http.ResponseWriter, r *http.Request) {
								if r.Method != http.MethodPost {
									utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
									return
								}
								carHandler.CreateCar(w, r)
							},
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

	// /api/cars/{id}/estimate - Get price estimate (authenticated)
	if strings.HasSuffix(path, "/estimate") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.GetPriceEstimate(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/book - Upload registration book to existing car (authenticated)
	if strings.HasSuffix(path, "/book") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.UploadBook(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/images - Upload images (authenticated)
	if strings.Contains(path, "/images") && !strings.Contains(path, "/images/order") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.UploadCarImages(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/images/order - Reorder images (authenticated)
	if strings.HasSuffix(path, "/images/order") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPut {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.ReorderImages(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/status - Update status (authenticated)
	if strings.HasSuffix(path, "/status") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPut {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.UpdateStatus(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/inspection - Upload inspection (authenticated)
	if strings.HasSuffix(path, "/inspection") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.UploadInspection(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/draft - Auto-save draft (authenticated)
	if strings.HasSuffix(path, "/draft") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPatch {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.AutoSaveDraft(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/review - Review publish readiness (authenticated)
	if strings.HasSuffix(path, "/review") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.Review(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/discard - Discard draft (authenticated; alias for delete)
	if strings.HasSuffix(path, "/discard") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.DiscardCar(w, r)
		})(w, r)
		return
	}

	// /api/cars/{id}/restore-progress - Restore progress from another car (authenticated)
	if strings.HasSuffix(path, "/restore-progress") {
		authMiddleware.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			handler.RestoreProgress(w, r)
		})(w, r)
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
			utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	utils.WriteError(w, http.StatusNotFound, "Not found")
}
