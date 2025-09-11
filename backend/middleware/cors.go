package middleware

import (
	"net/http"
	"strings"
)

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware(allowedOriginsConfig string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Get origin from request
			origin := r.Header.Get("Origin")
			
			// If no origin header, allow the request (same-origin or non-browser requests)
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Split comma-separated origins from config
			allowedOrigins := strings.Split(allowedOriginsConfig, ",")
			// Trim whitespace
			for i, orig := range allowedOrigins {
				allowedOrigins[i] = strings.TrimSpace(orig)
			}

			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if origin == allowedOrigin {
					allowed = true
					break
				}
			}

			// Fail fast: Reject unauthorized origins immediately
			if !allowed {
				http.Error(w, "CORS: Origin not allowed", http.StatusForbidden)
				return
			}

			// Set CORS headers for allowed origins
			w.Header().Set("Access-Control-Allow-Origin", origin)

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			// Call next handler
			next.ServeHTTP(w, r)
		}
	}
}

// SecurityHeadersMiddleware adds security headers
func SecurityHeadersMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Call next handler
		next.ServeHTTP(w, r)
	}
}
