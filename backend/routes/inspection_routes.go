package routes

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers" // <--- แก้ไข path ให้ตรงกับโปรเจคของคุณ
)

// InspectionRoutes sets up the routes for the inspection feature.
func InspectionRoutes(allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()
	
	// Endpoint: /api/scrape/dlt
	handler := http.HandlerFunc(handlers.ScrapeInspectionData)
	mux.Handle("/dlt", applyCORS(handler, allowedOrigins)) // Mount handler with CORS

	// Strip the prefix so that requests to "/api/scrape/dlt" are routed to "/dlt" in this mux.
	return http.StripPrefix("/api/scrape", mux)
}

// Simple CORS middleware helper to match your project's pattern
func applyCORS(next http.Handler, allowedOrigins []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if allowed == "*" || allowed == origin {
				isAllowed = true
				break
			}
		}

		if isAllowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		}

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}