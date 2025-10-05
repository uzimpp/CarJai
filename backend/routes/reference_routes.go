package routes

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
)

// ReferenceRoutes sets up reference data routes (same pattern as health.go)
func ReferenceRoutes(db interface{}, corsOrigins []string) http.Handler {
	mux := http.NewServeMux()

	// Type assert db to *sql.DB (matches health.go pattern)
	handler := handlers.NewReferenceHandler(db.(*sql.DB))

	// Apply CORS middleware
	corsMiddleware := middleware.CORSMiddleware(corsOrigins)

	// GET /api/reference-data - Get all reference data (public)
	mux.HandleFunc("/api/reference-data", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})).ServeHTTP(w, r)
			return
		}
		if r.Method == http.MethodGet {
			corsMiddleware(http.HandlerFunc(handler.GetReferenceData)).ServeHTTP(w, r)
			return
		}
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	return mux
}
