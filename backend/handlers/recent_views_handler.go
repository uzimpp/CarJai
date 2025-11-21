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
	profileService     *services.ProfileService
}

// NewRecentViewsHandler creates a new recent views handler
func NewRecentViewsHandler(recentViewsService *services.RecentViewsService, profileService *services.ProfileService) *RecentViewsHandler {
	return &RecentViewsHandler{
		recentViewsService: recentViewsService,
		profileService:     profileService,
	}
}

// RecordView handles recording a car view
func (h *RecentViewsHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Restrict to buyers only
	roles, err := h.profileService.GetRolesForUser(userID)
	if err != nil || !roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Only buyers can record recent views")
		return
	}

	var req models.RecentViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate car ID
	if req.CarID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Record the view
	err = h.recentViewsService.RecordView(userID, req.CarID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to record view: "+err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "View recorded successfully")
}

// GetRecentViews handles getting user's recent views
func (h *RecentViewsHandler) GetRecentViews(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Restrict to buyers only
	roles, err := h.profileService.GetRolesForUser(userID)
	if err != nil || !roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Only buyers can access recent views")
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

	// Get language preference (default to English)
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Get recent views as CarListItem objects
	listItems, err := h.recentViewsService.GetUserRecentViews(userID, limit, lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get recent views: "+err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, listItems, "Recent views retrieved successfully")
}
