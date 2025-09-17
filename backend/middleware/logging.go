package middleware

import (
	"log"
	"net"
	"net/http"
	"strings"
	"time"
)

// getClientIP extracts the real client IP from the request
func getClientIP(r *http.Request) string {
	// Check for forwarded headers first (for requests behind proxies/load balancers)
	if xForwardedFor := r.Header.Get("X-Forwarded-For"); xForwardedFor != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}
	
	if xRealIP := r.Header.Get("X-Real-IP"); xRealIP != "" {
		return xRealIP
	}
	
	// Fall back to RemoteAddr, but clean it up
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// LoggingMiddleware logs HTTP requests with detailed information
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract request information
		clientIP := getClientIP(r)
		timestamp := start.Format("2006-01-02 15:04:05")
		
		// Create a custom ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Log the request with detailed information
		duration := time.Since(start)
		log.Printf("[%s] %s %s %d %v | IP: %s | User-Agent: %s | Referer: %s",
			timestamp,
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			clientIP,
			r.UserAgent(),
			r.Header.Get("Referer"),
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
		
		// Extract request information
		clientIP := getClientIP(r)
		timestamp := start.Format("2006-01-02 15:04:05")
		
		// Create a custom ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Log the admin request with additional context
		duration := time.Since(start)
		log.Printf("[ADMIN %s] %s %s %d %v | IP: %s | AdminID: %s | Username: %s | SessionID: %s | User-Agent: %s",
			timestamp,
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			clientIP,
			adminID,
			adminUsername,
			sessionID,
			r.UserAgent(),
		)
	}
}

// DetailedLoggingMiddleware provides comprehensive request logging with all available information
func DetailedLoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract comprehensive request information
		clientIP := getClientIP(r)
		timestamp := start.Format("2006-01-02 15:04:05")
		
		// Get additional request details
		host := r.Host
		scheme := "http"
		if r.TLS != nil {
			scheme = "https"
		}
		fullURL := scheme + "://" + host + r.URL.RequestURI()
		
		// Create a custom ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Log comprehensive request information
		duration := time.Since(start)
		log.Printf("[%s] %s %s %d %v | IP: %s | Host: %s | URL: %s | User-Agent: %s | Referer: %s | Content-Length: %s | Content-Type: %s",
			timestamp,
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			duration,
			clientIP,
			host,
			fullURL,
			r.UserAgent(),
			r.Header.Get("Referer"),
			r.Header.Get("Content-Length"),
			r.Header.Get("Content-Type"),
		)
	}
}
