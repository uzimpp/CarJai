package handlers

import (
	"database/sql"
	"net/http"
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
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
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

// checkDatabase checks database connectivity and validates migrations
func (h *HealthHandler) checkDatabase() ServiceStatus {
	start := time.Now()

	if h.db == nil {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).String(),
			Error:        "database connection is nil",
		}
	}

	// Check database connectivity
	err := h.db.Ping()
	if err != nil {
		responseTime := time.Since(start)
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: responseTime.String(),
			Error:        err.Error(),
		}
	}

	// Validate that all required tables exist (migration validation)
	migrationStatus := h.validateMigrations()
	responseTime := time.Since(start)

	if migrationStatus.Error != "" {
		return ServiceStatus{
			Status:       "unhealthy",
			ResponseTime: responseTime.String(),
			Error:        migrationStatus.Error,
			Details:      migrationStatus.Details,
		}
	}

	return ServiceStatus{
		Status:       "healthy",
		ResponseTime: responseTime.String(),
		Details:      migrationStatus.Details,
	}
}

// validateMigrations checks if all required tables exist
func (h *HealthHandler) validateMigrations() ServiceStatus {
	requiredTables := []string{
		"admins",
		"admin_sessions",
		"admin_ip_whitelist",
		"users",
		"user_sessions",
		"sellers",
		"seller_contacts",
		"buyers",
		"cars",
		"car_images",
		"car_inspection_results",
		"market_price",
		"recent_views",
		"favourites",
		"reports",
	}

	var missingTables []string
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name = $1
	`

	for _, table := range requiredTables {
		var exists string
		err := h.db.QueryRow(query, table).Scan(&exists)
		if err != nil {
			missingTables = append(missingTables, table)
		}
	}

	if len(missingTables) > 0 {
		return ServiceStatus{
			Status: "unhealthy",
			Error:  "Migration validation failed: missing required tables",
			Details: map[string]interface{}{
				"missing_tables": missingTables,
				"total_required": len(requiredTables),
				"missing_count":  len(missingTables),
			},
		}
	}

	return ServiceStatus{
		Status: "healthy",
		Details: map[string]interface{}{
			"total_tables": len(requiredTables),
			"all_present":  true,
		},
	}
}
