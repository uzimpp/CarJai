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
	allowedOrigins []string,
	allowedIPs []string,
) *http.ServeMux {

	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)

	// Create handler instances
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)

	// Create router
	router := http.NewServeMux()

	// Admin authentication routes (no auth required, but IP whitelist required)
	router.HandleFunc(adminPrefix+"/auth/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoginRateLimit()(
						middleware.LoggingMiddleware(
							adminAuthHandler.Signin,
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (auth required)
	router.HandleFunc(adminPrefix+"/auth/signout",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
						middleware.GeneralRateLimit()(
							authMiddleware.RequireAuth(
								authMiddleware.RequireIPWhitelist(
									adminAuthHandler.Signout,
								),
							),
						),
					),
				),
			),
		),
	)

	router.HandleFunc(adminPrefix+"/auth/me",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminAuthHandler.Me,
							),
						),
					),
				),
			),
		),
	)

	router.HandleFunc(adminPrefix+"/auth/refresh",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminAuthHandler.RefreshToken,
							),
						),
					),
				),
			),
		),
	)

	// Admin IP whitelist management routes
	router.HandleFunc(adminPrefix+"/ip-whitelist",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.GetWhitelistedIPs,
							),
						),
					),
				),
			),
		),
	)

	router.HandleFunc(adminPrefix+"/ip-whitelist/add",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.AddIPToWhitelist,
							),
						),
					),
				),
			),
		),
	)

	router.HandleFunc(adminPrefix+"/ip-whitelist/remove",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.RemoveIPFromWhitelist,
							),
						),
					),
				),
			),
		),
	)

	// Catch-all route for any other admin paths (like /admin/signin page access)
	router.HandleFunc(adminPrefix+"/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					func(w http.ResponseWriter, r *http.Request) {
						// This handles any unmatched admin routes
						// Return 404 for unmatched API routes, but allow frontend routing
						if r.URL.Path != "/" {
							http.NotFound(w, r)
							return
						}
						// For root admin path, return success (frontend will handle routing)
						w.WriteHeader(http.StatusOK)
						w.Write([]byte("Admin API is running"))
					},
				),
			),
		),
	)

	return router
}
