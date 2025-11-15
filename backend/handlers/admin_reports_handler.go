package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
)

// AdminReportsHandler handles admin report operations
type AdminReportsHandler struct {
	reportService *services.ReportService
	userService   *services.UserService
	carService    *services.CarService
	adminService  *services.AdminService
}

// NewAdminReportsHandler creates a new admin reports handler
func NewAdminReportsHandler(
	reportService *services.ReportService,
	userService *services.UserService,
	carService *services.CarService,
	adminService *services.AdminService,
) *AdminReportsHandler {
	return &AdminReportsHandler{
		reportService: reportService,
		userService:   userService,
		carService:    carService,
		adminService:  adminService,
	}
}

// AdminReportResponse represents the response format for admin reports
type AdminReportResponse struct {
	ID              int     `json:"id"`
	Type            string  `json:"type"` // "user" or "car" (mapped from "seller" or "car")
	ReportedById    int     `json:"reportedById"`
	ReportedByName  string  `json:"reportedByName"`
	ReportedByEmail string  `json:"reportedByEmail"`
	TargetUserId    *int    `json:"targetUserId,omitempty"` // For user reports (seller)
	TargetUserName  *string `json:"targetUserName,omitempty"`
	TargetCarId     *int    `json:"targetCarId,omitempty"` // For car reports
	TargetCarTitle  *string `json:"targetCarTitle,omitempty"`
	Reason          string  `json:"reason"` // topic
	Description     *string `json:"description,omitempty"`
	Status          string  `json:"status"`
	CreatedAt       string  `json:"createdAt"`
	ResolvedAt      *string `json:"resolvedAt,omitempty"`
	ResolvedBy      *string `json:"resolvedBy,omitempty"` // Admin name
}

// ListReports handles GET /admin/reports
func (h *AdminReportsHandler) ListReports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Parse query parameters
	reportType := r.URL.Query().Get("type") // "user", "car", or empty
	status := r.URL.Query().Get("status")   // "pending", "resolved", "dismissed", or empty

	// Map frontend types to backend types
	var backendType string
	if reportType == "user" {
		backendType = "seller" // Backend uses "seller" but frontend expects "user"
	} else if reportType == "car" {
		backendType = "car"
	}

	// Build filters
	filters := models.ReportFilters{
		Type:   backendType,
		Status: status,
		Limit:  100, // Get all reports for now
		Offset: 0,
	}

	// Get reports from service
	reports, total, err := h.reportService.ListReports(filters)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to admin response format
	adminReports := make([]AdminReportResponse, 0, len(reports))
	for _, report := range reports {
		adminReport := h.convertToAdminReport(report)
		adminReports = append(adminReports, adminReport)
	}

	// Create response
	response := map[string]interface{}{
		"success": true,
		"data":    adminReports,
		"total":   total,
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

// ResolveReport handles POST /admin/reports/{id}/resolve
func (h *AdminReportsHandler) ResolveReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from header
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Extract report ID from path
	reportID, err := h.extractReportID(r.URL.Path, "/admin/reports/", "/resolve")
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	// Update report status to "resolved"
	notes := "Report resolved by admin"
	err = h.reportService.UpdateReportStatus(reportID, "resolved", &notes, adminID)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create response
	response := map[string]interface{}{
		"success": true,
		"message": "Report resolved successfully",
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

// DismissReport handles POST /admin/reports/{id}/dismiss
func (h *AdminReportsHandler) DismissReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from header
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Extract report ID from path
	reportID, err := h.extractReportID(r.URL.Path, "/admin/reports/", "/dismiss")
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	// Update report status to "dismissed"
	notes := "Report dismissed by admin"
	err = h.reportService.UpdateReportStatus(reportID, "dismissed", &notes, adminID)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create response
	response := map[string]interface{}{
		"success": true,
		"message": "Report dismissed successfully",
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

// BanUser handles POST /admin/users/{id}/ban
func (h *AdminReportsHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from header
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Extract user ID from path
	userID, err := h.extractUserID(r.URL.Path, "/admin/users/", "/ban")
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Ban the seller (seller ID = user ID)
	notes := "User banned by admin"
	_, err = h.reportService.BanSeller(userID, adminID, &notes)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create response
	response := map[string]interface{}{
		"success": true,
		"message": "User banned successfully",
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

// RemoveCar handles POST /admin/cars/{id}/remove
func (h *AdminReportsHandler) RemoveCar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Extract car ID from path
	carID, err := h.extractCarID(r.URL.Path, "/admin/cars/", "/remove")
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Delete car as admin (isAdmin = true, userID = 0 since admin doesn't own the car)
	err = h.carService.DeleteCar(carID, 0, true)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create response
	response := map[string]interface{}{
		"success": true,
		"message": "Car listing removed successfully",
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

// convertToAdminReport converts a backend Report to AdminReportResponse
// This function handles missing data gracefully by using placeholder values
func (h *AdminReportsHandler) convertToAdminReport(report models.Report) AdminReportResponse {
	adminReport := AdminReportResponse{
		ID:          report.ID,
		Reason:      report.Topic,
		Status:      report.Status,
		CreatedAt:   report.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Description: &report.Description,
	}

	// Map report type: backend uses "seller" but frontend expects "user"
	if report.ReportType == "seller" {
		adminReport.Type = "user"
		if report.SellerID != nil {
			adminReport.TargetUserId = report.SellerID
		}
	} else if report.ReportType == "car" {
		adminReport.Type = "car"
		if report.CarID != nil {
			adminReport.TargetCarId = report.CarID
		}
	}

	// Get reporter user (required field)
	reporterUser, err := h.userService.GetUserByID(report.ReporterID)
	if err != nil {
		// If user not found, use placeholder values but still return the report
		adminReport.ReportedById = report.ReporterID
		adminReport.ReportedByName = fmt.Sprintf("User #%d", report.ReporterID)
		adminReport.ReportedByEmail = "unknown@example.com"
	} else if reporterUser != nil {
		adminReport.ReportedById = reporterUser.ID
		adminReport.ReportedByName = reporterUser.Name
		adminReport.ReportedByEmail = reporterUser.Email
	} else {
		// User is nil but no error - use placeholder
		adminReport.ReportedById = report.ReporterID
		adminReport.ReportedByName = fmt.Sprintf("User #%d", report.ReporterID)
		adminReport.ReportedByEmail = "unknown@example.com"
	}

	// Get target user info (for seller reports)
	if report.ReportType == "seller" && report.SellerID != nil {
		targetUser, err := h.userService.GetUserByID(*report.SellerID)
		if err == nil && targetUser != nil {
			name := targetUser.Name
			adminReport.TargetUserName = &name
		}
	}

	// Get target car info (for car reports)
	if report.ReportType == "car" && report.CarID != nil {
		car, err := h.carService.GetCarByID(*report.CarID)
		if err == nil && car != nil {
			// Create title from car fields
			var titleParts []string
			if car.BrandName != nil {
				titleParts = append(titleParts, *car.BrandName)
			}
			if car.ModelName != nil {
				titleParts = append(titleParts, *car.ModelName)
			}
			if car.SubmodelName != nil {
				titleParts = append(titleParts, *car.SubmodelName)
			}
			if car.Year != nil {
				titleParts = append(titleParts, fmt.Sprintf("(%d)", *car.Year))
			}
			if len(titleParts) > 0 {
				title := strings.Join(titleParts, " ")
				adminReport.TargetCarTitle = &title
			} else {
				defaultTitle := fmt.Sprintf("Car #%d", *report.CarID)
				adminReport.TargetCarTitle = &defaultTitle
			}
		}
	}

	// Get resolved info
	if report.ReviewedAt != nil {
		resolvedAt := report.ReviewedAt.Format("2006-01-02T15:04:05Z07:00")
		adminReport.ResolvedAt = &resolvedAt
	}

	if report.ReviewedByAdminID != nil {
		// Get admin name
		admin, err := h.adminService.GetAdminByID(*report.ReviewedByAdminID)
		if err == nil && admin != nil {
			name := admin.Name
			adminReport.ResolvedBy = &name
		}
	}

	return adminReport
}

// extractReportID extracts report ID from URL path like /admin/reports/123/resolve
func (h *AdminReportsHandler) extractReportID(path, prefix, suffix string) (int, error) {
	if !strings.HasPrefix(path, prefix) {
		return 0, fmt.Errorf("invalid path prefix")
	}
	path = strings.TrimPrefix(path, prefix)
	if !strings.HasSuffix(path, suffix) {
		return 0, fmt.Errorf("invalid path suffix")
	}
	path = strings.TrimSuffix(path, suffix)
	id, err := strconv.Atoi(path)
	if err != nil {
		return 0, fmt.Errorf("invalid report ID: %w", err)
	}
	return id, nil
}

// extractUserID extracts user ID from URL path like /admin/users/123/ban
func (h *AdminReportsHandler) extractUserID(path, prefix, suffix string) (int, error) {
	if !strings.HasPrefix(path, prefix) {
		return 0, fmt.Errorf("invalid path prefix")
	}
	path = strings.TrimPrefix(path, prefix)
	if !strings.HasSuffix(path, suffix) {
		return 0, fmt.Errorf("invalid path suffix")
	}
	path = strings.TrimSuffix(path, suffix)
	id, err := strconv.Atoi(path)
	if err != nil {
		return 0, fmt.Errorf("invalid user ID: %w", err)
	}
	return id, nil
}

// extractCarID extracts car ID from URL path like /admin/cars/123/remove
func (h *AdminReportsHandler) extractCarID(path, prefix, suffix string) (int, error) {
	if !strings.HasPrefix(path, prefix) {
		return 0, fmt.Errorf("invalid path prefix")
	}
	path = strings.TrimPrefix(path, prefix)
	if !strings.HasSuffix(path, suffix) {
		return 0, fmt.Errorf("invalid path suffix")
	}
	path = strings.TrimSuffix(path, suffix)
	id, err := strconv.Atoi(path)
	if err != nil {
		return 0, fmt.Errorf("invalid car ID: %w", err)
	}
	return id, nil
}

// writeJSONResponse writes a JSON response
func (h *AdminReportsHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// writeErrorResponse writes a JSON error response
func (h *AdminReportsHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}

	json.NewEncoder(w).Encode(response)
}
