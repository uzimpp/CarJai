package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
)

// ProfileRoutes sets up profile-related routes (authenticated)
func ProfileRoutes(
	profileService *services.ProfileService,
	userService *services.UserService,
	carService *services.CarService,
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	profileHandler := handlers.NewProfileHandler(profileService, userService, carService)

	// Create auth middleware
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Create router
	router := http.NewServeMux()

	// Profile routes (GET/PATCH) - handles /api/profile/self
	// PATCH supports unified updates: account fields (username, name), buyer profile, and/or seller profile
	router.HandleFunc("/api/profile/self",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							func(w http.ResponseWriter, r *http.Request) {
								switch r.Method {
								case http.MethodGet:
									profileHandler.Profile(w, r)
								case http.MethodPatch:
									profileHandler.UpdateSelf(w, r)
								default:
									http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
								}
							},
						),
					),
				),
			),
		),
	)

	// Seller profile route (GET) - public endpoint for displaying seller profile by ID
	router.HandleFunc("/api/profile/seller/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								profileHandler.GetSellerProfile(w, r)
							} else {
								http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
							}
						},
					),
				),
			),
		),
	)

	return router
}
