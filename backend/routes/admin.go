package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminRoutes sets up admin authentication routes
func AdminRoutes(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	adminPrefix string,
	corsAllowedOrigins string,
) *http.ServeMux {
	
	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)
	
	// Create handler instances
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)
	
	// Create router
	router := http.NewServeMux()
	
	// Admin authentication routes (no auth required)
	router.HandleFunc("/auth/login", 
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
					middleware.LoggingMiddleware(
						adminAuthHandler.Login,
					),
				),
			),
		),
	)
	
	// Admin authentication routes (auth required)
	router.HandleFunc("/auth/logout",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							adminAuthHandler.Logout,
						),
					),
				),
			),
		),
	)
	
	router.HandleFunc("/auth/me",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireAuth(
						authMiddleware.RequireIPWhitelist(
							adminAuthHandler.Me,
						),
					),
				),
			),
		),
	)
	
	router.HandleFunc("/auth/refresh",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireAuth(
						authMiddleware.RequireIPWhitelist(
							adminAuthHandler.RefreshToken,
						),
					),
				),
			),
		),
	)
	
	// Admin IP whitelist management routes
	router.HandleFunc("/ip-whitelist",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireAuth(
						authMiddleware.RequireIPWhitelist(
							adminIPHandler.GetWhitelistedIPs,
						),
					),
				),
			),
		),
	)
	
	router.HandleFunc("/ip-whitelist/add",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireAuth(
						authMiddleware.RequireIPWhitelist(
							adminIPHandler.AddIPToWhitelist,
						),
					),
				),
			),
		),
	)
	
	router.HandleFunc("/ip-whitelist/remove",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireAuth(
						authMiddleware.RequireIPWhitelist(
							adminIPHandler.RemoveIPFromWhitelist,
						),
					),
				),
			),
		),
	)
	
	return router
}
