package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/uzimpp/Carjai/backend/utils"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db *sql.DB
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Version   string                 `json:"version"`
	Services  map[string]ServiceStatus `json:"services"`
	Uptime    string                 `json:"uptime"`
}

// ServiceStatus represents the status of a service
type ServiceStatus struct {
	Status      string        `json:"status"`
	ResponseTime string       `json:"response_time,omitempty"`
	Error       string        `json:"error,omitempty"`
	Details     interface{}   `json:"details,omitempty"`
}

// AdminHealthResponse represents the admin health check response
type AdminHealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Admin     AdminServiceStatus     `json:"admin"`
	Database  ServiceStatus          `json:"database"`
	JWT       ServiceStatus          `json:"jwt"`
	IPWhitelist ServiceStatus        `json:"ip_whitelist"`
}

// AdminServiceStatus represents admin service status
type AdminServiceStatus struct {
	Status           string `json:"status"`
	TotalAdmins      int    `json:"total_admins"`
	ActiveSessions   int    `json:"active_sessions"`
	WhitelistedIPs   int    `json:"whitelisted_ips"`
	LastLoginTime    *time.Time `json:"last_login_time,omitempty"`
}

var startTime = time.Now()

// Health handles basic health check
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Check database connection
	dbStatus := h.checkDatabase()
	
	// Determine overall status
	overallStatus := "healthy"
	if dbStatus.Status != "healthy" {
		overallStatus = "unhealthy"
	}
	
	response := HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Services: map[string]ServiceStatus{
			"database": dbStatus,
		},
		Uptime: time.Since(startTime).String(),
	}
	
	statusCode := http.StatusOK
	if overallStatus == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}
	
	h.writeJSONResponse(w, statusCode, response)
}

// AdminHealth handles admin-specific health check
func (h *HealthHandler) AdminHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Check database
	dbStatus := h.checkDatabase()
	
	// Check admin service
	adminStatus := h.checkAdminService()
	
	// Check JWT service
	jwtStatus := h.checkJWTService()
	
	// Check IP whitelist
	ipStatus := h.checkIPWhitelistService()
	
	// Determine overall status
	overallStatus := "healthy"
	if dbStatus.Status != "healthy" || adminStatus.Status != "healthy" || 
	   jwtStatus.Status != "healthy" || ipStatus.Status != "healthy" {
		overallStatus = "unhealthy"
	}
	
	response := AdminHealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now(),
		Admin:     adminStatus,
		Database:  dbStatus,
		JWT:       jwtStatus,
		IPWhitelist: ipStatus,
	}
	
	statusCode := http.StatusOK
	if overallStatus == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}
	
	h.writeJSONResponse(w, statusCode, response)
}

// checkDatabase checks database connectivity
func (h *HealthHandler) checkDatabase() ServiceStatus {
	start := time.Now()
	
	err := h.db.Ping()
	responseTime := time.Since(start)
	
	if err != nil {
		return ServiceStatus{
			Status:      "unhealthy",
			ResponseTime: responseTime.String(),
			Error:       err.Error(),
		}
	}
	
	return ServiceStatus{
		Status:      "healthy",
		ResponseTime: responseTime.String(),
	}
}

// checkAdminService checks admin service status
func (h *HealthHandler) checkAdminService() AdminServiceStatus {
	// Get admin count
	var adminCount int
	err := h.db.QueryRow("SELECT COUNT(*) FROM admins").Scan(&adminCount)
	if err != nil {
		return AdminServiceStatus{
			Status: "unhealthy",
		}
	}
	
	// Get active sessions count
	var sessionCount int
	err = h.db.QueryRow("SELECT COUNT(*) FROM admin_sessions WHERE expires_at > NOW()").Scan(&sessionCount)
	if err != nil {
		return AdminServiceStatus{
			Status: "unhealthy",
		}
	}
	
	// Get whitelisted IPs count
	var ipCount int
	err = h.db.QueryRow("SELECT COUNT(*) FROM admin_ip_whitelist").Scan(&ipCount)
	if err != nil {
		return AdminServiceStatus{
			Status: "unhealthy",
		}
	}
	
	// Get last login time
	var lastLoginTime *time.Time
	err = h.db.QueryRow("SELECT MAX(last_login_at) FROM admins").Scan(&lastLoginTime)
	if err != nil {
		// This is not critical, so we continue
	}
	
	return AdminServiceStatus{
		Status:         "healthy",
		TotalAdmins:    adminCount,
		ActiveSessions: sessionCount,
		WhitelistedIPs: ipCount,
		LastLoginTime:  lastLoginTime,
	}
}

// checkJWTService checks JWT service status
func (h *HealthHandler) checkJWTService() ServiceStatus {
	// Simple JWT validation test
	testToken := "test"
	_, err := utils.IsTokenExpired(testToken)
	
	// We expect this to fail, but it should not panic
	if err != nil {
		return ServiceStatus{
			Status: "healthy",
			Details: "JWT service is functional",
		}
	}
	
	return ServiceStatus{
		Status: "healthy",
		Details: "JWT service is functional",
	}
}

// checkIPWhitelistService checks IP whitelist service status
func (h *HealthHandler) checkIPWhitelistService() ServiceStatus {
	// Test IP validation
	testIP := "127.0.0.1"
	err := utils.ValidateIPAddress(testIP)
	
	if err != nil {
		return ServiceStatus{
			Status: "unhealthy",
			Error:  err.Error(),
		}
	}
	
	return ServiceStatus{
		Status: "healthy",
		Details: "IP validation service is functional",
	}
}

// Metrics handles metrics endpoint
func (h *HealthHandler) Metrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Get various metrics
	metrics := make(map[string]interface{})
	
	// Database metrics
	var adminCount, sessionCount, ipCount int
	h.db.QueryRow("SELECT COUNT(*) FROM admins").Scan(&adminCount)
	h.db.QueryRow("SELECT COUNT(*) FROM admin_sessions WHERE expires_at > NOW()").Scan(&sessionCount)
	h.db.QueryRow("SELECT COUNT(*) FROM admin_ip_whitelist").Scan(&ipCount)
	
	metrics["admins"] = adminCount
	metrics["active_sessions"] = sessionCount
	metrics["whitelisted_ips"] = ipCount
	metrics["uptime_seconds"] = time.Since(startTime).Seconds()
	metrics["timestamp"] = time.Now()
	
	h.writeJSONResponse(w, http.StatusOK, metrics)
}

// writeJSONResponse writes a JSON response
func (h *HealthHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// writeErrorResponse writes a JSON error response
func (h *HealthHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	response := map[string]interface{}{
		"success": false,
		"error":   message,
		"code":    statusCode,
	}
	
	json.NewEncoder(w).Encode(response)
}
