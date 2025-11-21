package routes

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// FavouritesRoutes sets up routes for user favourites
func FavouritesRoutes(favService *services.FavouriteService, userService *services.UserService, corsOrigins []string) *http.ServeMux {
	router := http.NewServeMux()
	handler := handlers.NewFavouriteHandler(favService, userService)

	// Create auth middleware
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// GET /api/favorites/my - Get user's favourites
	router.HandleFunc("/api/favorites/my",
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
								handler.GetMyFavourites(w, r)
							},
						),
					),
				),
			),
		),
	)

	// POST /api/favorites/{carId} - Add favourite
	// DELETE /api/favorites/{carId} - Remove favourite
	router.HandleFunc("/api/favorites/",
		middleware.CORSMiddleware(corsOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							func(w http.ResponseWriter, r *http.Request) {
								path := r.URL.Path
								idPart := strings.TrimPrefix(path, "/api/favorites/")

								// Check if it's a valid car ID path (no nested paths)
								if strings.Contains(idPart, "/") || idPart == "" {
									utils.WriteError(w, http.StatusNotFound, "Not found")
									return
								}
								switch r.Method {
								case http.MethodPost:
									handler.AddFavourite(w, r)
								case http.MethodDelete:
									handler.RemoveFavourite(w, r)
								default:
									utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								}
							},
						),
					),
				),
			),
		),
	)

	return router
}
