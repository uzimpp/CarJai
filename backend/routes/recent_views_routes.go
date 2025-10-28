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
	userService *services.UserService,
	userJWTManager *utils.JWTManager,
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	recentViewsHandler := handlers.NewRecentViewsHandler(recentViewsService)

	// Create router
	router := http.NewServeMux()

	// Create middleware instances
	corsMiddleware := middleware.CORSMiddleware(allowedOrigins)
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Record a car view (POST)
	router.HandleFunc("/api/recent-views/record",
		corsMiddleware(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							recentViewsHandler.RecordView,
						),
					),
				),
			),
		),
	)

	// Get user's recent views (GET)
	router.HandleFunc("/api/recent-views",
		corsMiddleware(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							recentViewsHandler.GetRecentViews,
						),
					),
				),
			),
		),
	)

	return router
}