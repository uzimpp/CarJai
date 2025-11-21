package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

type ReportHandler struct {
	reportService *services.ReportService
	userService   *services.UserService
}

func NewReportHandler(reportService *services.ReportService, userService *services.UserService) *ReportHandler {
	return &ReportHandler{reportService: reportService, userService: userService}
}

type submitReportRequest struct {
	Topic       string   `json:"topic"`
	SubTopics   []string `json:"subTopics"`
	Description string   `json:"description"`
}

// SubmitCarReport handles POST /api/reports/cars/{id}
func (h *ReportHandler) SubmitCarReport(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	carID, err := extractIDFromPathReport(r.URL.Path, "/api/reports/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	var req submitReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if strings.TrimSpace(req.Topic) == "" || strings.TrimSpace(req.Description) == "" {
		utils.WriteError(w, http.StatusBadRequest, "topic and description are required")
		return
	}

	id, err := h.reportService.SubmitCarReport(userID, carID, req.Topic, req.SubTopics, req.Description)
	if err != nil {
		if h.reportService.IsConflict(err) {
			utils.WriteError(w, http.StatusConflict, err.Error())
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response := models.ReportSubmitResponse{
		ID:      id,
		Message: fmt.Sprintf("Reported car %d successfully", carID),
	}
	utils.WriteJSON(w, http.StatusCreated, response, "")
}

// SubmitSellerReport handles POST /api/reports/sellers/{id}
func (h *ReportHandler) SubmitSellerReport(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	sellerID, err := extractIDFromPathReport(r.URL.Path, "/api/reports/sellers/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid seller ID")
		return
	}

	var req submitReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if strings.TrimSpace(req.Topic) == "" || strings.TrimSpace(req.Description) == "" {
		utils.WriteError(w, http.StatusBadRequest, "topic and description are required")
		return
	}

	id, err := h.reportService.SubmitSellerReport(userID, sellerID, req.Topic, req.SubTopics, req.Description)
	if err != nil {
		if h.reportService.IsConflict(err) {
			utils.WriteError(w, http.StatusConflict, err.Error())
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response := models.ReportSubmitResponse{
		ID:      id,
		Message: fmt.Sprintf("Reported seller %d successfully", sellerID),
	}
	utils.WriteJSON(w, http.StatusCreated, response, "")
}

// Helper function to extract ID from URL path (local to this file)
func extractIDFromPathReport(path, prefix string) (int, error) {
	// Remove prefix
	idStr := strings.TrimPrefix(path, prefix)

	// Remove anything after the ID
	if idx := strings.Index(idStr, "/"); idx != -1 {
		idStr = idStr[:idx]
	}

	// Parse ID
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("invalid ID format")
	}

	return id, nil
}
