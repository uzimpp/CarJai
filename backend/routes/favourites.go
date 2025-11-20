package routes

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
)

// FavouritesRoutes sets up routes for user favourites
func FavouritesRoutes(favService *services.FavouriteService, userService *services.UserService, corsOrigins []string) http.Handler {
	mux := http.NewServeMux()
	handler := handlers.NewFavouriteHandler(favService, userService)

	// Apply CORS middleware
	corsMiddleware := middleware.CORSMiddleware(corsOrigins)
	// Apply user authentication middleware
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// POST /api/favorites/{carId} and DELETE /api/favorites/{carId}
	mux.HandleFunc("/api/favorites/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}

		path := r.URL.Path
		// GET /api/favorites/my
		if strings.HasPrefix(path, "/api/favorites/my") && r.Method == http.MethodGet {
			corsMiddleware(authMiddleware.RequireAuth(handler.GetMyFavourites)).ServeHTTP(w, r)
			return
		}

		// For paths like /api/favorites/{carId}
		idPart := strings.TrimPrefix(path, "/api/favorites/")
		if !strings.Contains(idPart, "/") || idPart == "" {
			switch r.Method {
			case http.MethodPost:
				corsMiddleware(authMiddleware.RequireAuth(handler.AddFavourite)).ServeHTTP(w, r)
			case http.MethodDelete:
				corsMiddleware(authMiddleware.RequireAuth(handler.RemoveFavourite)).ServeHTTP(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		http.Error(w, "Not found", http.StatusNotFound)
	})

	return mux
}
