package routes

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
)

// PublicSellerRoutes sets up public seller routes (no auth required)
func PublicSellerRoutes(
	profileService *services.ProfileService,
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	publicSellerHandler := handlers.NewPublicSellerHandler(profileService)

	// Create router
	router := http.NewServeMux()

	// Public seller information routes (GET)
	router.HandleFunc("/api/sellers/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							// Route based on path
							path := strings.TrimPrefix(r.URL.Path, "/api/sellers/")
							parts := strings.Split(path, "/")

							if len(parts) == 1 || (len(parts) == 2 && parts[1] == "") {
								// GET /api/sellers/{id}
								publicSellerHandler.GetSeller(w, r)
							} else if len(parts) >= 2 {
								switch parts[1] {
								case "contacts":
									// GET /api/sellers/{id}/contacts
									publicSellerHandler.GetSellerContacts(w, r)
								case "cars":
									// GET /api/sellers/{id}/cars
									publicSellerHandler.GetSellerCars(w, r)
								default:
									http.Error(w, "Not found", http.StatusNotFound)
								}
							} else {
								http.Error(w, "Not found", http.StatusNotFound)
							}
						},
					),
				),
			),
		),
	)

	return router
}
