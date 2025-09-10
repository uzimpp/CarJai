package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/Carjai/backend/models"
	"github.com/uzimpp/Carjai/backend/services"
	"github.com/uzimpp/Carjai/backend/utils"
)

// AuthMiddleware handles admin authentication
type AuthMiddleware struct {
	adminService *services.AdminService
	jwtManager   *utils.JWTManager
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(adminService *services.AdminService, jwtManager *utils.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{
		adminService: adminService,
		jwtManager:   jwtManager,
	}
}

// RequireAuth middleware that requires valid admin authentication
func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		token, err := utils.ExtractTokenFromHeader(authHeader)
		if err != nil {
			m.writeErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header")
			return
		}
		
		// Validate JWT token
		claims, err := m.jwtManager.ValidateToken(token)
		if err != nil {
			m.writeErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}
		
		// Validate session in database
		session, err := m.adminService.ValidateSession(token)
		if err != nil {
			m.writeErrorResponse(w, http.StatusUnauthorized, "Invalid session")
			return
		}
		
		// Check if session admin ID matches token admin ID
		if session.AdminID != claims.AdminID {
			m.writeErrorResponse(w, http.StatusUnauthorized, "Session mismatch")
			return
		}
		
		// Add admin info to request context
		r.Header.Set("X-Admin-ID", fmt.Sprintf("%d", claims.AdminID))
		r.Header.Set("X-Admin-Username", claims.Username)
		r.Header.Set("X-Session-ID", claims.SessionID)
		
		// Call next handler
		next.ServeHTTP(w, r)
	}
}

// RequireIPWhitelist middleware that checks IP whitelist
func (m *AuthMiddleware) RequireIPWhitelist(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract admin ID from context (set by RequireAuth)
		adminIDStr := r.Header.Get("X-Admin-ID")
		if adminIDStr == "" {
			m.writeErrorResponse(w, http.StatusUnauthorized, "Admin ID not found")
			return
		}
		
		// Convert admin ID to int
		adminID, err := strconv.Atoi(adminIDStr)
		if err != nil {
			m.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
			return
		}
		
		// Extract client IP
		clientIP := utils.ExtractClientIP(
			r.RemoteAddr,
			r.Header.Get("X-Forwarded-For"),
			r.Header.Get("X-Real-IP"),
		)
		
		if clientIP == "" {
			m.writeErrorResponse(w, http.StatusBadRequest, "Unable to determine client IP")
			return
		}
		
		// Get whitelisted IPs for admin
		whitelistedIPs, err := m.adminService.GetWhitelistedIPs(adminID)
		if err != nil {
			m.writeErrorResponse(w, http.StatusInternalServerError, "Failed to check IP whitelist")
			return
		}
		
		// Convert to string slice
		var ipList []string
		for _, entry := range whitelistedIPs {
			ipList = append(ipList, entry.IPAddress)
		}
		
		// Check if IP is whitelisted
		isWhitelisted, err := utils.IsIPWhitelisted(clientIP, ipList)
		if err != nil {
			m.writeErrorResponse(w, http.StatusInternalServerError, "Failed to validate IP address")
			return
		}
		
		if !isWhitelisted {
			m.writeErrorResponse(w, http.StatusForbidden, "IP address not authorized")
			return
		}
		
		// Call next handler
		next.ServeHTTP(w, r)
	}
}

// RequireAdminRoute middleware that ensures request is to admin routes
func (m *AuthMiddleware) RequireAdminRoute(adminPrefix string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// Check if request path starts with admin prefix
			if !strings.HasPrefix(r.URL.Path, adminPrefix) {
				m.writeErrorResponse(w, http.StatusNotFound, "Admin route not found")
				return
			}
			
			// Call next handler
			next.ServeHTTP(w, r)
		}
	}
}

// writeErrorResponse writes a JSON error response
func (m *AuthMiddleware) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}
	
	json.NewEncoder(w).Encode(response)
}
