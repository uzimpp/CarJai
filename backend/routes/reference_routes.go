package routes

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ReferenceRoutes sets up reference data routes (match style used in profile.go)
func ReferenceRoutes(db interface{}, allowedOrigins []string) *http.ServeMux {
	// Create handler instance
	referenceHandler := handlers.NewReferenceHandler(db.(*sql.DB))

	// Create router
	router := http.NewServeMux()

	// GET /api/reference-data/all
	router.HandleFunc("/api/reference-data/all",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								referenceHandler.GetAll(w, r)
							} else {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
							}
						},
					),
				),
			),
		),
	)

	// GET /api/reference-data/brands
	router.HandleFunc("/api/reference-data/brands",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								referenceHandler.GetBrands(w, r)
							} else {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
							}
						},
					),
				),
			),
		),
	)

	// GET /api/reference-data/models
	router.HandleFunc("/api/reference-data/models",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								referenceHandler.GetModels(w, r)
							} else {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
							}
						},
					),
				),
			),
		),
	)

	// GET /api/reference-data/submodels
	router.HandleFunc("/api/reference-data/submodels",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method == http.MethodGet {
								referenceHandler.GetSubModels(w, r)
							} else {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
							}
						},
					),
				),
			),
		),
	)

	return router
}
