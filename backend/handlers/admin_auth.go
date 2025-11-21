package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/config"
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
	appConfig      *config.AppConfig
}

// NewAdminAuthHandler creates a new admin auth handler
func NewAdminAuthHandler(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	authMiddleware *middleware.AuthMiddleware,
	appConfig *config.AppConfig,
) *AdminAuthHandler {
	return &AdminAuthHandler{
		adminService:   adminService,
		jwtManager:     jwtManager,
		authMiddleware: authMiddleware,
		appConfig:      appConfig,
	}
}

// Signin handles admin sign in
func (h *AdminAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
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
		Secure:   h.appConfig.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})

	response := models.AdminSigninResponse{
		Admin:     signinResponse.Admin,
		Token:     token,
		ExpiresAt: expiresAt,
	}
	utils.WriteJSON(w, http.StatusOK, response, "Sign in successful")
}

// Signout handles admin sign out
func (h *AdminAuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
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
		Secure:   h.appConfig.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // Expire immediately
	})

	// Create response
	utils.WriteJSON(w, http.StatusOK, nil, "Sign out successful")
}

// Me handles getting current admin information
func (h *AdminAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
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

	// Return AdminMeData which includes both admin and session information
	utils.WriteJSON(w, http.StatusOK, adminData, "Admin information retrieved successfully")
}

// RefreshToken handles token refresh
func (h *AdminAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
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

	response := models.AdminRefreshResponse{
		Token:     newToken,
		ExpiresAt: expiresAt,
	}
	utils.WriteJSON(w, http.StatusOK, response, "Token refreshed successfully")
}

// GetAdmins handles GET /admin/admins
func (h *AdminAuthHandler) GetAdmins(w http.ResponseWriter, r *http.Request) {
	admins, err := h.adminService.GetManagedAdmins()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve admins")
		return
	}

	response := models.AdminAdminsListResponse{
		Admins: admins,
		Total:  len(admins),
	}

	utils.WriteJSON(w, http.StatusOK, response, "Admins retrieved successfully")
}

// CreateAdmin handles POST /admin/admins
func (h *AdminAuthHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req models.AdminCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validation
	if req.Username == "" || req.Name == "" || req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "Username, Name, and Password are required")
		return
	}

	// --- Extract Client IP ---
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)

	serviceReq := services.CreateAdminRequest{
		Username: req.Username,
		Name:     req.Name,
		Password: req.Password,
	}

	newAdmin, err := h.adminService.CreateAdmin(serviceReq, clientIP)

	if err != nil {
		if err.Error() == "username already exists" {
			utils.WriteError(w, http.StatusConflict, err.Error())
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := models.AdminPublic{
		ID:        newAdmin.ID,
		Username:  newAdmin.Username,
		Name:      newAdmin.Name,
		Role:      newAdmin.Role,
		CreatedAt: newAdmin.CreatedAt,
	}

	utils.WriteJSON(w, http.StatusCreated, response, "Admin created successfully")
}

// UpdateAdmin handles PATCH /admin/admins/{id}
func (h *AdminAuthHandler) UpdateAdmin(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL (e.g., /admin/admins/1 -> 1)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	var req services.UpdateAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err = h.adminService.UpdateAdmin(id, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Admin updated successfully")
}

// DeleteAdmin handles DELETE /admin/admins/{id}
func (h *AdminAuthHandler) DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	// Prevent self-deletion (Optional but recommended)
	// You can check X-Admin-ID header vs id here if needed

	err = h.adminService.DeleteAdmin(id)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Admin deleted successfully")
}
