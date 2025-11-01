package routes

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminRoutes sets up admin authentication routes
func AdminRoutes(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	// Add ExtractionService
	extractionService *services.ExtractionService,
	adminPrefix string,
	allowedOrigins []string,
	allowedIPs []string,
) *http.ServeMux {
	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)

	// Create handler instances
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)
	// Create Handler for Extraction
	adminExtractionHandler := handlers.NewAdminExtractionHandler(extractionService)

	// Create router
	router := http.NewServeMux()
	basePath := strings.TrimSuffix(adminPrefix, "/")

	// --- Middleware Chain Helper (for brevity) ---
	applyAdminAuthMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		// Middleware chain for fully protected admin routes requiring authentication and IP whitelist
		return middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.GeneralRateLimit()( // Add general rate limit
						middleware.AdminLoggingMiddleware( // Use Admin logging
							authMiddleware.RequireAuth(
								authMiddleware.RequireIPWhitelist(
									handler,
								),
							),
						),
					),
				),
			),
		)
	}

	// --- Admin Authentication Routes ---
	// Signin needs special handling (LoginRateLimit, no auth required yet)
	router.HandleFunc(basePath+"/auth/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoginRateLimit()( // Specific rate limit for login
						middleware.LoggingMiddleware( // Use general logging for potentially unauthenticated requests
							adminAuthHandler.Signin,
						),
					),
				),
			),
		),
	)
	// Other auth routes use the standard protected middleware chain
	router.HandleFunc(basePath+"/auth/signout", applyAdminAuthMiddleware(adminAuthHandler.Signout))
	router.HandleFunc(basePath+"/auth/me", applyAdminAuthMiddleware(adminAuthHandler.Me))
	router.HandleFunc(basePath+"/auth/refresh", applyAdminAuthMiddleware(adminAuthHandler.RefreshToken))

	// --- Admin IP Whitelist Management Routes ---
	router.HandleFunc(basePath+"/ip-whitelist", applyAdminAuthMiddleware(adminIPHandler.GetWhitelistedIPs))
	router.HandleFunc(basePath+"/ip-whitelist/add", applyAdminAuthMiddleware(adminIPHandler.AddIPToWhitelist))
	router.HandleFunc(basePath+"/ip-whitelist/remove", applyAdminAuthMiddleware(adminIPHandler.RemoveIPFromWhitelist))

	// --- Market Price Import/Extract Route (POST PDF) ---
	// This endpoint only use for extract data
	router.HandleFunc(basePath+"/market-price/import", applyAdminAuthMiddleware(adminExtractionHandler.HandleImportMarketPrices))

	// --- Market Price Commit Route (POST JSON) ---
	// This endpoint receive JSON and insert to DB
	router.HandleFunc(basePath+"/market-price/commit", applyAdminAuthMiddleware(adminExtractionHandler.HandleCommitMarketPrices))

	// --- Health Check & Root ---
	// Health check and Root only need Global IP Whitelist and general logging
	router.HandleFunc(basePath+"/health",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoggingMiddleware( // Use general logging
						func(w http.ResponseWriter, r *http.Request) {
							w.WriteHeader(http.StatusOK)
							fmt.Fprintln(w, "Admin OK")
						},
					),
				),
			),
		),
	)
	router.HandleFunc(basePath+"/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoggingMiddleware( // Use general logging
						func(w http.ResponseWriter, r *http.Request) {
							if r.URL.Path == basePath+"/" {
								w.WriteHeader(http.StatusOK)
								w.Write([]byte("Admin API Root"))
							} else {
								http.NotFound(w, r) // Return 404 for other unmatched paths under /admin/
							}
						},
					),
				),
			),
		),
	)

	return router
}