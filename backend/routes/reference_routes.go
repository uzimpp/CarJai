package routes

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
)

// ReferenceRoutes sets up reference data routes
func ReferenceRoutes(db interface{}, corsOrigins []string) *http.ServeMux {
	// Type assert db to *sql.DB
	handler := handlers.NewReferenceHandler(db.(*sql.DB))

	// Create router
	router := http.NewServeMux()

	// Apply CORS middleware
	corsMiddleware := middleware.CORSMiddleware(corsOrigins)

	// GET /api/reference-data - Get all reference data (public)
	router.HandleFunc("/api/reference-data",
		corsMiddleware(
			middleware.SecurityHeadersMiddleware(
				middleware.LoggingMiddleware(
					handler.GetReferenceData,
				),
			),
		),
	)

	return router
}
