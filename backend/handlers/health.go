package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
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
	Status    string                   `json:"status"`
	Timestamp time.Time                `json:"timestamp"`
	Version   string                   `json:"version"`
	Services  map[string]ServiceStatus `json:"services"`
	Uptime    string                   `json:"uptime"`
}

// ServiceStatus represents the status of a service
type ServiceStatus struct {
	Status       string      `json:"status"`
	ResponseTime string      `json:"response_time,omitempty"`
	Error        string      `json:"error,omitempty"`
	Details      interface{} `json:"details,omitempty"`
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

// checkDatabase checks database connectivity
func (h *HealthHandler) checkDatabase() ServiceStatus {
	start := time.Now()

	if h.db == nil {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).String(),
			Error:        "database connection is nil",
		}
	}

	err := h.db.Ping()
	responseTime := time.Since(start)

	if err != nil {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: responseTime.String(),
			Error:        err.Error(),
		}
	}

	return ServiceStatus{
		Status:       "healthy",
		ResponseTime: responseTime.String(),
	}
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
