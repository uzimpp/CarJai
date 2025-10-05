package routes

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
)

// HealthRoutes sets up health check routes
func HealthRoutes(db interface{}, allowedOrigins []string) *http.ServeMux {
	// Create health handler
	healthHandler := handlers.NewHealthHandler(db.(*sql.DB))
	
	// Create router
	router := http.NewServeMux()
	
	// Health check endpoints (GET)
	router.HandleFunc("/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					healthHandler.Health,
				),
			),
		),
	)

	// Health check endpoints (GET)
	router.HandleFunc("/health/metrics",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					healthHandler.Metrics,
				),
			),
		),
	)
	
	return router
}
