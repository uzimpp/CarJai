package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/uzimpp/Carjai/backend/middleware"
	"github.com/uzimpp/Carjai/backend/models"
	"github.com/uzimpp/Carjai/backend/services"
	"github.com/uzimpp/Carjai/backend/utils"
)

// AdminAuthHandler handles admin authentication endpoints
type AdminAuthHandler struct {
	adminService *services.AdminService
	jwtManager   *utils.JWTManager
	authMiddleware *middleware.AuthMiddleware
}

// NewAdminAuthHandler creates a new admin auth handler
func NewAdminAuthHandler(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	authMiddleware *middleware.AuthMiddleware,
) *AdminAuthHandler {
	return &AdminAuthHandler{
		adminService:   adminService,
		jwtManager:     jwtManager,
		authMiddleware: authMiddleware,
	}
}

// Login handles admin login
func (h *AdminAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Parse request body
	var loginReq models.AdminLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Extract client IP
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	
	if clientIP == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "Unable to determine client IP")
		return
	}
	
	// Prepare login request
	loginRequest := services.LoginRequest{
		Username:  loginReq.Username,
		Password:  loginReq.Password,
		IPAddress: clientIP,
		UserAgent: r.UserAgent(),
	}
	
	// Attempt login
	loginResponse, err := h.adminService.Login(loginRequest)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}
	
	// Generate JWT token
	token, expiresAt, err := h.jwtManager.GenerateToken(
		loginResponse.Admin.ID,
		loginResponse.Admin.Username,
		"session_"+string(rune(time.Now().Unix())), // Simple session ID
	)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	
	// Create response
	response := models.AdminLoginResponse{
		Success: true,
		Data: models.AdminAuthData{
			Admin:     loginResponse.Admin,
			Token:     token,
			ExpiresAt: expiresAt,
		},
		Message: "Login successful",
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// Logout handles admin logout
func (h *AdminAuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Parse request body
	var logoutReq models.AdminLogoutRequest
	if err := json.NewDecoder(r.Body).Decode(&logoutReq); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	
	// Prepare logout request
	logoutRequest := services.LogoutRequest{
		Token: logoutReq.Token,
	}
	
	// Attempt logout
	err := h.adminService.Logout(logoutRequest)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}
	
	// Create response
	response := models.AdminLogoutResponse{
		Success: true,
		Message: "Logout successful",
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// Me handles getting current admin information
func (h *AdminAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Extract token from Authorization header
	authHeader := r.Header.Get("Authorization")
	token, err := utils.ExtractTokenFromHeader(authHeader)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header")
		return
	}
	
	// Get current admin information
	adminData, err := h.adminService.GetCurrentAdmin(token)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}
	
	// Create response
	response := models.AdminMeResponse{
		Success: true,
		Data:    *adminData,
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// RefreshToken handles token refresh
func (h *AdminAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	
	// Extract token from Authorization header
	authHeader := r.Header.Get("Authorization")
	token, err := utils.ExtractTokenFromHeader(authHeader)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, "Invalid authorization header")
		return
	}
	
	// Refresh token
	newToken, expiresAt, err := h.jwtManager.RefreshToken(token)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}
	
	// Create response
	response := map[string]interface{}{
		"success":    true,
		"token":      newToken,
		"expires_at": expiresAt,
		"message":    "Token refreshed successfully",
	}
	
	h.writeJSONResponse(w, http.StatusOK, response)
}

// writeJSONResponse writes a JSON response
func (h *AdminAuthHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// writeErrorResponse writes a JSON error response
func (h *AdminAuthHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}
	
	json.NewEncoder(w).Encode(response)
}
