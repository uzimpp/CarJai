package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// RecentViewsRoutes sets up recent views routes
func RecentViewsRoutes(
	recentViewsService *services.RecentViewsService,
	profileService *services.ProfileService,
	userService *services.UserService,
	userJWTManager *utils.JWTManager,
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	recentViewsHandler := handlers.NewRecentViewsHandler(recentViewsService, profileService)

	// Create router
	router := http.NewServeMux()

	// Create middleware instances
	corsMiddleware := middleware.CORSMiddleware(allowedOrigins)
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Handles both POST (record view) and GET (get recent views)
	router.HandleFunc("/api/recent-views",
		corsMiddleware(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							func(w http.ResponseWriter, r *http.Request) {
								switch r.Method {
								case http.MethodPost:
									recentViewsHandler.RecordView(w, r)
								case http.MethodGet:
									recentViewsHandler.GetRecentViews(w, r)
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

	return router
}
