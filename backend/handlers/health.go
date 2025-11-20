package handlers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/utils"
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
	// Allow both GET and HEAD for health checks (HEAD is used by wget --spider)
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// For HEAD requests, perform full health check but return status only (no body)
	if r.Method == http.MethodHead {
		dbStatus := h.checkDatabase()
		if dbStatus.Status == "healthy" {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
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

	utils.WriteJSON(w, statusCode, response, "")
}

// checkDatabase checks database connectivity and validates migrations succeeded
// If migrations failed (tables don't exist), database is unhealthy even if connectable
func (h *HealthHandler) checkDatabase() ServiceStatus {
	start := time.Now()

	if h.db == nil {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).String(),
			Error:        "database connection is nil",
		}
	}

	// Create context with timeout for health check (max 2 seconds for faster response)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Step 1: Check database connectivity
	err := h.db.PingContext(ctx)
	if err != nil {
		responseTime := time.Since(start)
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: responseTime.String(),
			Error:        "database connection failed: " + err.Error(),
		}
	}

	// Step 2: Validate migrations by checking if critical table exists
	// If migrations failed (syntax errors, etc.), tables won't exist
	// This catches cases where DB is connectable but migrations failed
	migrationErr := h.validateMigrations(ctx)
	responseTime := time.Since(start)

	if migrationErr != nil {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: responseTime.String(),
			Error:        migrationErr.Error(),
		}
	}

	return ServiceStatus{
		Status:       "healthy",
		ResponseTime: responseTime.String(),
	}
}

// validateMigrations checks if migrations succeeded by querying a critical table
// Uses minimal query - just checks if the first table from first migration exists
func (h *HealthHandler) validateMigrations(ctx context.Context) error {
	// Check the first table from the first migration (001_admin_auth.sql)
	// If this table doesn't exist, migrations definitely failed
	var count int
	query := `SELECT COUNT(*) FROM reports`
	err := h.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		// Check if error is "relation does not exist" (migration failure)
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "does not exist") || strings.Contains(errStr, "relation") {
			return errors.New("migration validation failed: critical table 'admins' does not exist - database migrations may have failed (check migration logs for syntax errors)")
		}
		// Other errors (permissions, etc.) are also concerning
		return errors.New("migration validation failed: cannot query table 'admins': " + err.Error())
	}

	return nil
}
