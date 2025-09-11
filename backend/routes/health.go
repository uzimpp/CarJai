package routes

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
)

// HealthRoutes sets up health check routes
func HealthRoutes(db interface{}, corsAllowedOrigins string) *http.ServeMux {
	// Create health handler
	healthHandler := handlers.NewHealthHandler(db.(*sql.DB))
	
	// Create router
	router := http.NewServeMux()
	
	// Health check endpoints
	router.HandleFunc("/health",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					healthHandler.Health,
				),
			),
		),
	)
	
	router.HandleFunc("/admin/health",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					healthHandler.AdminHealth,
				),
			),
		),
	)
	
	router.HandleFunc("/metrics",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					healthHandler.Metrics,
				),
			),
		),
	)
	
	return router
}
