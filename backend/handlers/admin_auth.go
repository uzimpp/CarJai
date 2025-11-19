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

// Signin handles admin sign in
func (h *AdminAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Parse request body
	var signinReq models.AdminSigninRequest
	if err := json.NewDecoder(r.Body).Decode(&signinReq); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Extract client IP
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)

	if clientIP == "" {
		utils.WriteError(w, http.StatusBadRequest, "Unable to determine client IP")
		return
	}

	// Prepare sign in request
	signinRequest := services.SigninRequest{
		Username:  signinReq.Username,
		Password:  signinReq.Password,
		IPAddress: clientIP,
		UserAgent: r.UserAgent(),
	}

	// Attempt sign in
	signinResponse, err := h.adminService.Signin(signinRequest)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Use token created by service (already persisted with session)
	token := signinResponse.Token
	expiresAt := signinResponse.ExpiresAt

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
	response := models.AdminSigninResponse{
		Success: true,
		Data: models.AdminAuthData{
			Admin:     signinResponse.Admin,
			Token:     token,
			ExpiresAt: expiresAt,
		},
		Message: "Sign in successful",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// Signout handles admin sign out
func (h *AdminAuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Read token from cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil || cookie.Value == "" {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Attempt sign out using the cookie token
	signoutRequest := services.SignoutRequest{Token: cookie.Value}
	err = h.adminService.Signout(signoutRequest)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
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
	response := models.AdminSignoutResponse{
		Success: true,
		Message: "Sign out successful",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// Me handles getting current admin information
func (h *AdminAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get token from admin_jwt cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	// Get current admin information
	adminData, err := h.adminService.GetCurrentAdmin(token)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Create response
	response := models.AdminMeResponse{
		Success: true,
		Data:    *adminData,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// RefreshToken handles token refresh
func (h *AdminAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get token from admin_jwt cookie
	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	// Refresh token
	newToken, expiresAt, err := h.jwtManager.RefreshToken(token)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Create response
	response := map[string]interface{}{
		"success":    true,
		"token":      newToken,
		"expires_at": expiresAt,
		"message":    "Token refreshed successfully",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// HandleGetAdmins handles GET /admin/admins
func (h *AdminAuthHandler) HandleGetAdmins(w http.ResponseWriter, r *http.Request) {
	admins, err := h.adminService.GetManagedAdmins()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve admins")
		return
	}

	response := models.AdminAdminsListResponse{
		Success: true,
		Data:    admins,
		Total:   len(admins),
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// HandleCreateAdmin handles POST /admin/admins
func (h *AdminAuthHandler) HandleCreateAdmin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.AdminCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validation (Basic check, ideally use a validator library)
	if req.Username == "" || req.Name == "" || req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "Username, Name, and Password are required")
		return
	}

	serviceReq := services.CreateAdminRequest{
		Username: req.Username,
		Name:     req.Name,
		Password: req.Password,
	}

	newAdmin, err := h.adminService.CreateAdmin(serviceReq)
	if err != nil {
		if err.Error() == "username already exists" {
			utils.WriteError(w, http.StatusConflict, err.Error())
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"success": true,
		"data":    newAdmin,
		"message": "Admin created successfully",
	}

	utils.WriteJSON(w, http.StatusCreated, response)
}