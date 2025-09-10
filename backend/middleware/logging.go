package middleware

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a custom ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Log the request
		duration := time.Since(start)
		log.Printf("%s %s %d %v %s %s",
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			r.RemoteAddr,
			r.UserAgent(),
		)
	}
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// AdminLoggingMiddleware logs admin-specific requests with additional context
func AdminLoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract admin info from headers (set by auth middleware)
		adminID := r.Header.Get("X-Admin-ID")
		adminUsername := r.Header.Get("X-Admin-Username")
		sessionID := r.Header.Get("X-Session-ID")
		
		// Create a custom ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Log the admin request with additional context
		duration := time.Since(start)
		log.Printf("[ADMIN] %s %s %d %v AdminID:%s Username:%s SessionID:%s IP:%s",
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			adminID,
			adminUsername,
			sessionID,
			r.RemoteAddr,
		)
	}
}
