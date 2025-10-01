package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// UserAuthHandler handles user authentication requests
type UserAuthHandler struct {
	userService *services.UserService
}

// NewUserAuthHandler creates a new user auth handler
func NewUserAuthHandler(userService *services.UserService) *UserAuthHandler {
	return &UserAuthHandler{
		userService: userService,
	}
}

// Signup handles user signup requests
func (h *UserAuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.UserSignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" || req.Password == "" {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Email and password are required",
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	if len(req.Password) < 6 {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Password must be at least 6 characters long",
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Extract client context (consistent with admin)
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	userAgent := r.UserAgent()

	// Create user
	response, err := h.userService.Signup(req.Email, req.Password, clientIP, userAgent)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(errorResponse)
		return
	}

	// Set jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Data.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.Data.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusCreated, response)
}

// Signin handles user sign in requests
func (h *UserAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.UserSigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Basic validation
	if req.Email == "" || req.Password == "" {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Email and password are required",
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Extract client context (consistent with admin)
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	userAgent := r.UserAgent()

	// Sign in user
	response, err := h.userService.Signin(req.Email, req.Password, clientIP, userAgent)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid credentials",
			Code:    http.StatusUnauthorized,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(errorResponse)
		return
	}

	// Set jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Data.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.Data.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusOK, response)
}

// Signout handles user sign out requests
func (h *UserAuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get token from jwt cookie
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	// Sign out user
	response, err := h.userService.Signout(token)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		}
		utils.WriteJSON(w, http.StatusBadRequest, errorResponse)
		return
	}

	// Clear jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // Expire immediately
	})

	utils.WriteJSON(w, http.StatusOK, response)
}

// Me handles getting current user information
func (h *UserAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get token from jwt cookie
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	// Get current user
	response, err := h.userService.GetCurrentUser(token)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid token",
			Code:    http.StatusUnauthorized,
		}
		utils.WriteJSON(w, http.StatusUnauthorized, errorResponse)
		return
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// RefreshToken handles token refresh requests
func (h *UserAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get token from jwt cookie
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	// Extract client context (consistent with admin)
	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	userAgent := r.UserAgent()

	// Refresh token
	response, err := h.userService.RefreshToken(token, clientIP, userAgent)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid token",
			Code:    http.StatusUnauthorized,
		}
		utils.WriteJSON(w, http.StatusUnauthorized, errorResponse)
		return
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// getClientIP extracts the client IP address from the request
// (removed) getClientIP: use utils.ExtractClientIP for a single, shared implementation
