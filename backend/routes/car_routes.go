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
	userJWT *utils.JWTManager,
	corsOrigins []string,
) http.Handler {
	mux := http.NewServeMux()
	handler := handlers.NewCarHandler(carService, userService)

	// Apply CORS middleware
	corsMiddleware := middleware.CORSMiddleware(corsOrigins)

	// Apply user authentication middleware
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Public routes (no authentication required)
	// GET /api/cars/{id} - Get car details with images
	mux.HandleFunc("/api/cars/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}

		path := r.URL.Path

		// GET /api/cars/images/{id} - Get image data (public)
		if strings.HasPrefix(path, "/api/cars/images/") && r.Method == http.MethodGet {
			corsMiddleware(http.HandlerFunc(handler.GetCarImage)).ServeHTTP(w, r)
			return
		}

		// DELETE /api/cars/images/{id} - Delete image (requires auth)
		if strings.HasPrefix(path, "/api/cars/images/") && r.Method == http.MethodDelete {
			corsMiddleware(authMiddleware.RequireAuth(handler.DeleteCarImage)).ServeHTTP(w, r)
			return
		}

		// Extract ID from path
		idPart := strings.TrimPrefix(path, "/api/cars/")

		// POST /api/cars/{id}/images - Upload images (requires auth)
		if strings.HasSuffix(path, "/images") && r.Method == http.MethodPost {
			corsMiddleware(authMiddleware.RequireAuth(handler.UploadCarImages)).ServeHTTP(w, r)
			return
		}

		// If path contains only ID (no trailing segments)
		if !strings.Contains(idPart, "/") || idPart == "" {
			switch r.Method {
			case http.MethodGet:
				// GET /api/cars/{id} - Get single car (public)
				corsMiddleware(http.HandlerFunc(handler.GetCar)).ServeHTTP(w, r)
			case http.MethodPut:
				// PUT /api/cars/{id} - Update car (requires auth)
				corsMiddleware(authMiddleware.RequireAuth(handler.UpdateCar)).ServeHTTP(w, r)
			case http.MethodDelete:
				// DELETE /api/cars/{id} - Delete car (requires auth)
				corsMiddleware(authMiddleware.RequireAuth(handler.DeleteCar)).ServeHTTP(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		http.Error(w, "Not found", http.StatusNotFound)
	})

	// Public search endpoint
	// GET /api/cars/search - Search/filter active cars (public)
	mux.HandleFunc("/api/cars/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodGet {
			corsMiddleware(http.HandlerFunc(handler.SearchCars)).ServeHTTP(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// Protected routes (require authentication)
	// POST /api/cars - Create new car listing
	mux.HandleFunc("/api/cars", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodPost {
			corsMiddleware(authMiddleware.RequireAuth(handler.CreateCar)).ServeHTTP(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// GET /api/cars/my - Get current user's cars
	mux.HandleFunc("/api/cars/my", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodGet {
			corsMiddleware(authMiddleware.RequireAuth(handler.GetMyCars)).ServeHTTP(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	return mux
}
