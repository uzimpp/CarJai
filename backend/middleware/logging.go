package middleware

import (
	"bytes"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/utils"
)

// getRequestSize calculates the approximate size of the incoming request
func getRequestSize(r *http.Request) int64 {
	size := int64(0)
	if r.ContentLength > 0 {
		size = r.ContentLength
	}
	return size
}

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

// LoggingMiddleware logs HTTP requests with structured logging
func LoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract request information
		clientIP := getClientIP(r)
		
		// Create ResponseWriter to capture response data
		responseBuffer := &bytes.Buffer{}
		wrapped := &responseWriter{
			ResponseWriter: w, 
			statusCode:     http.StatusOK,
			responseData:   responseBuffer,
		}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Calculate metrics
		duration := time.Since(start)
		requestSize := getRequestSize(r)
		responseSize := int64(responseBuffer.Len())
		
		// Prepare response data for logging (limit size for performance)
		responseData := responseBuffer.String()
		if len(responseData) > 1000 {
			responseData = responseData[:1000] + "...[truncated]"
		}
		
		// Use structured logging with all available request/response information
		utils.AppLogger.LogHTTPRequest(
			r.Method,
			r.URL.Path,
			clientIP,
			r.UserAgent(),
			wrapped.statusCode,
			duration,
			requestSize,
			responseSize,
			responseData,
		)
	}
}

// Enhanced responseWriter wraps http.ResponseWriter to capture status code and response data
// This allows us to log the complete request-response cycle including returned data
type responseWriter struct {
	http.ResponseWriter
	statusCode   int
	responseData *bytes.Buffer
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(data []byte) (int, error) {
	// Capture response data for logging
	if rw.responseData != nil {
		rw.responseData.Write(data)
	}
	return rw.ResponseWriter.Write(data)
}

// AdminLoggingMiddleware logs admin-specific requests with enhanced structured logging
// Includes additional admin context
func AdminLoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract admin info from headers (set by auth middleware)
		adminID := r.Header.Get("X-Admin-ID")
		adminUsername := r.Header.Get("X-Admin-Username")
		sessionID := r.Header.Get("X-Session-ID")
		
		// Extract request information
		clientIP := getClientIP(r)
		
		// Create enhanced ResponseWriter to capture response data
		responseBuffer := &bytes.Buffer{}
		wrapped := &responseWriter{
			ResponseWriter: w, 
			statusCode:     http.StatusOK,
			responseData:   responseBuffer,
		}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Calculate metrics
		duration := time.Since(start)
		requestSize := getRequestSize(r)
		responseSize := int64(responseBuffer.Len())
		
		// Prepare response data for logging (limit size for performance)
		responseData := responseBuffer.String()
		if len(responseData) > 1000 {
			responseData = responseData[:1000] + "...[truncated]"
		}
		
		// Use structured logging with admin context
		utils.AppLogger.LogHTTPRequestWithContext(
			r.Method,
			r.URL.Path,
			clientIP,
			r.UserAgent(),
			wrapped.statusCode,
			duration,
			requestSize,
			responseSize,
			responseData,
			map[string]interface{}{
				"admin_id":       adminID,
				"admin_username": adminUsername,
				"session_id":     sessionID,
				"request_type":   "admin",
			},
		)
	}
}

// DetailedLoggingMiddleware provides comprehensive request logging with enhanced structured format
// Captures all available request/response information
func DetailedLoggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Extract comprehensive request information
		clientIP := getClientIP(r)
		
		// Get additional request details for comprehensive logging
		host := r.Host
		scheme := "http"
		if r.TLS != nil {
			scheme = "https"
		}
		fullURL := scheme + "://" + host + r.URL.RequestURI()
		
		// Create enhanced ResponseWriter to capture response data	
		responseBuffer := &bytes.Buffer{}
		wrapped := &responseWriter{
			ResponseWriter: w, 
			statusCode:     http.StatusOK,
			responseData:   responseBuffer,
		}
		
		// Call next handler
		next.ServeHTTP(wrapped, r)
		
		// Calculate metrics
		duration := time.Since(start)
		requestSize := getRequestSize(r)
		responseSize := int64(responseBuffer.Len())
		
		// Prepare response data for logging (limit size for performance)
		responseData := responseBuffer.String()
		if len(responseData) > 1000 {
			responseData = responseData[:1000] + "...[truncated]"
		}
		
		// Use structured logging with comprehensive context
		utils.AppLogger.LogHTTPRequestWithContext(
			r.Method,
			r.URL.Path,
			clientIP,
			r.UserAgent(),
			wrapped.statusCode,
			duration,
			requestSize,
			responseSize,
			responseData,
			map[string]interface{}{
				"host":           host,
				"scheme":         scheme,
				"full_url":       fullURL,
				"referer":        r.Header.Get("Referer"),
				"content_length": r.Header.Get("Content-Length"),
				"content_type":   r.Header.Get("Content-Type"),
				"request_type":   "detailed",
			},
		)
	}
}
