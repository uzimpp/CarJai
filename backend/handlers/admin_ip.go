package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"api/models"
	"api/services"
	"api/utils"
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
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Get admin ID from context (set by auth middleware)
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}
	
	// Parse request body
	var ipReq models.AdminIPWhitelistRequest
	if err := json.NewDecoder(r.Body).Decode(&ipReq); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Validate IP address
	if err := utils.ValidateIPAddress(ipReq.IPAddress); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid IP address format")
		return
	}
	
	// Add IP to whitelist
	err = h.adminService.AddIPToWhitelist(adminID, ipReq.IPAddress, ipReq.Description)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	
	// Create response
	response := models.AdminIPWhitelistResponse{
		Success: true,
		Message: "IP address added to whitelist successfully",
	}
	
	h.writeJSONResponse(w, http.StatusCreated, response)
}

// RemoveIPFromWhitelist handles removing IP from whitelist
func (h *AdminIPHandler) RemoveIPFromWhitelist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Get admin ID from context
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}
	
	// Get IP address from query parameter
	ipAddress := r.URL.Query().Get("ip")
	if ipAddress == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "IP address parameter is required")
		return
	}
	
	// Remove IP from whitelist
	err = h.adminService.RemoveIPFromWhitelist(adminID, ipAddress)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	
	// Create response
	response := models.AdminIPWhitelistResponse{
		Success: true,
		Message: "IP address removed from whitelist successfully",
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// GetWhitelistedIPs handles getting whitelisted IPs
func (h *AdminIPHandler) GetWhitelistedIPs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Get admin ID from context
	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconv.Atoi(adminIDStr)
	if err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}
	
	// Get whitelisted IPs
	whitelistedIPs, err := h.adminService.GetWhitelistedIPs(adminID)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	
	// Create response
	response := models.AdminIPWhitelistResponse{
		Success: true,
		Data:    whitelistedIPs,
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// writeJSONResponse writes a JSON response
func (h *AdminIPHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// writeErrorResponse writes a JSON error response
func (h *AdminIPHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}
	
	json.NewEncoder(w).Encode(response)
}
