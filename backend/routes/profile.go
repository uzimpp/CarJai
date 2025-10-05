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
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	profileHandler := handlers.NewProfileHandler(profileService, userService)

	// Create router
	router := http.NewServeMux()

	// Profile routes (GET/PATCH) - handles /api/profile/self
	router.HandleFunc("/api/profile/self",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								profileHandler.Profile(w, r)
							} else if r.Method == http.MethodPatch {
								profileHandler.UpdateSelf(w, r)
							} else {
								http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
							}
						},
					),
				),
			),
		),
	)

	// Buyer profile routes (GET/PUT) - handles /api/profile/buyer
	router.HandleFunc("/api/profile/buyer",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								profileHandler.GetBuyerProfile(w, r)
							} else if r.Method == http.MethodPut {
								profileHandler.UpsertBuyerProfile(w, r)
							} else {
								http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
							}
						},
					),
				),
			),
		),
	)

	// Seller profile routes (GET/PUT) - handles /api/profile/seller
	router.HandleFunc("/api/profile/seller",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								profileHandler.GetSellerProfile(w, r)
							} else if r.Method == http.MethodPut {
								profileHandler.UpsertSellerProfile(w, r)
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
