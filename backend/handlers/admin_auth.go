package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminAuthHandler handles admin authentication endpoints
type AdminAuthHandler struct {
	adminService   *services.AdminService
	jwtManager     *utils.JWTManager
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

	// Use token created by service (already persisted with session)
	token := loginResponse.Token
	expiresAt := loginResponse.ExpiresAt

	// Set admin_jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_jwt",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})

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

	// Read token from cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil || cookie.Value == "" {
		h.writeErrorResponse(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Attempt logout using the cookie token
	logoutRequest := services.LogoutRequest{Token: cookie.Value}
	err = h.adminService.Logout(logoutRequest)
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Clear admin_jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_jwt",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // Expire immediately
	})

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

	// Get token from admin_jwt cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

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

	// Get token from admin_jwt cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		h.writeErrorResponse(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

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
