package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminIPHandler handles admin IP whitelist management
type AdminIPHandler struct {
	adminService *services.AdminService
}

// NewAdminIPHandler creates a new admin IP handler
func NewAdminIPHandler(adminService *services.AdminService) *AdminIPHandler {
	return &AdminIPHandler{
		adminService: adminService,
	}
}

// AddIPToWhitelist handles adding IP to whitelist
func (h *AdminIPHandler) AddIPToWhitelist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from context (set by auth middleware)
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Parse request body
	var ipReq models.AdminIPWhitelistRequest
	if err := json.NewDecoder(r.Body).Decode(&ipReq); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate IP address
	if err := utils.ValidateIPAddress(ipReq.IPAddress); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid IP address format")
		return
	}

	// Add IP to whitelist
	err = h.adminService.AddIPToWhitelist(adminID, ipReq.IPAddress, ipReq.Description)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusCreated, nil, "IP address added to whitelist successfully")
}

// RemoveIPFromWhitelist handles removing IP from whitelist
func (h *AdminIPHandler) RemoveIPFromWhitelist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from context
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Get IP address from query parameter
	ipAddress := r.URL.Query().Get("ip")
	if ipAddress == "" {
		utils.WriteError(w, http.StatusBadRequest, "IP address parameter is required")
		return
	}

	// Remove IP from whitelist
	err = h.adminService.RemoveIPFromWhitelist(adminID, ipAddress)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "IP address removed from whitelist successfully")
}

// CheckIPDeletionImpact checks if deleting an IP would affect the current session
func (h *AdminIPHandler) CheckIPDeletionImpact(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get IP address from query parameter
	ipAddress := r.URL.Query().Get("ip")
	if ipAddress == "" {
		utils.WriteError(w, http.StatusBadRequest, "IP address parameter is required")
		return
	}

	// Get current session from token
	wouldBlockSession := false
	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	session, err := h.adminService.ValidateSession(cookie.Value)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid session")
		return
	}

	// Check if the IP being deleted would block the current session's IP
	inRange, err := utils.IsIPInRange(session.IPAddress, ipAddress)
	if err == nil && inRange {
		wouldBlockSession = true
	}

	response := models.IPDeletionImpactResponse{
		WouldBlockSession: wouldBlockSession,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// GetWhitelistedIPs handles getting whitelisted IPs
func (h *AdminIPHandler) GetWhitelistedIPs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get admin ID from context
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Get whitelisted IPs
	whitelistedIPs, err := h.adminService.GetWhitelistedIPs(adminID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, whitelistedIPs, "")
}
