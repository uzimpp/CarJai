package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// RecentViewsHandler handles recent views requests
type RecentViewsHandler struct {
	recentViewsService *services.RecentViewsService
}

// NewRecentViewsHandler creates a new recent views handler
func NewRecentViewsHandler(recentViewsService *services.RecentViewsService) *RecentViewsHandler {
	return &RecentViewsHandler{
		recentViewsService: recentViewsService,
	}
}

// RecordView handles recording a car view
func (h *RecentViewsHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.RecentViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate car ID
	if req.CarID <= 0 {
		response := models.RecordViewResponse{
			Success: false,
			Message: "Invalid car ID",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Record the view
	err := h.recentViewsService.RecordView(userID, req.CarID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to record view: "+err.Error())
		return
	}

	response := models.RecordViewResponse{
		Success: true,
		Message: "View recorded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetRecentViews handles getting user's recent views
func (h *RecentViewsHandler) GetRecentViews(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get limit from query parameter (default: 20, max: 100)
	limitStr := r.URL.Query().Get("limit")
	limit := 20 // default
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	// Get recent views
	recentViews, err := h.recentViewsService.GetUserRecentViews(userID, limit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get recent views: "+err.Error())
		return
	}

	response := models.RecentViewsResponse{
		Success: true,
		Data:    recentViews,
		Message: "Recent views retrieved successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
