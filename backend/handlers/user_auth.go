package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/config"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// UserAuthHandler handles user authentication requests
type UserAuthHandler struct {
	userService *services.UserService
	appConfig   *config.AppConfig
}

// NewUserAuthHandler creates a new user auth handler
func NewUserAuthHandler(userService *services.UserService, appConfig *config.AppConfig) *UserAuthHandler {
	return &UserAuthHandler{
		userService: userService,
		appConfig:   appConfig,
	}
}

// Signup handles user signup requests
func (h *UserAuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.UserSignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" || req.Password == "" || req.Username == "" || req.Name == "" {
		utils.WriteError(w, http.StatusBadRequest, "Email, password, username, and name are required")
		return
	}

	if len(req.Password) < 6 {
		utils.WriteError(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	if len(req.Username) < 3 || len(req.Username) > 20 {
		utils.WriteError(w, http.StatusBadRequest, "Username must be between 3 and 20 characters")
		return
	}

	if len(req.Name) < 2 || len(req.Name) > 100 {
		utils.WriteError(w, http.StatusBadRequest, "Name must be between 2 and 100 characters")
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
	response, err := h.userService.Signup(req.Email, req.Password, req.Username, req.Name, clientIP, userAgent)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Set jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusCreated, response, "")
}

// Signin handles user sign in requests
func (h *UserAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	var req models.UserSigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.EmailOrUsername == "" || req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "Email/username and password are required")
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
	response, err := h.userService.Signin(req.EmailOrUsername, req.Password, clientIP, userAgent)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Set jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusOK, response, "")
}

// GoogleSignin handles user sign in using Google ID token (One Tap / GIS)
func (h *UserAuthHandler) GoogleSignin(w http.ResponseWriter, r *http.Request) {
	var req models.UserGoogleSigninRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.IDToken == "" {
		utils.WriteError(w, http.StatusBadRequest, "id_token is required")
		return
	}

	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	userAgent := r.UserAgent()

	response, err := h.userService.SigninWithGoogleIDToken(req.IDToken, clientIP, userAgent)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.ExpiresAt).Seconds()),
	})

	// Redirect to frontend after setting cookie for a smoother UX
	// Use first allowed origin from CORS config as frontend base
	var frontend string
	if len(h.appConfig.CORSAllowedOrigins) > 0 {
		frontend = strings.TrimSpace(h.appConfig.CORSAllowedOrigins[0])
	}
	frontend = strings.TrimSpace(frontend)
	if frontend == "" {
		frontend = "http://localhost:3000"
	}
	http.Redirect(w, r, frontend, http.StatusFound)
}

// GoogleStart initiates the OAuth flow by redirecting to Google's authorization URL
func (h *UserAuthHandler) GoogleStart(w http.ResponseWriter, r *http.Request) {
	clientID := h.appConfig.GoogleClientID
	redirectURI := h.appConfig.GoogleRedirectURI
	// Support fallback construction from BackendURL when explicit redirect is not set
	if redirectURI == "" && strings.TrimSpace(h.appConfig.BackendURL) != "" {
		base := strings.TrimSpace(h.appConfig.BackendURL)
		base = strings.TrimSuffix(base, "/")
		redirectURI = base + "/api/auth/google/callback"
	}
	if clientID == "" || redirectURI == "" {
		utils.WriteError(w, http.StatusInternalServerError, "Google OAuth not configured")
		return
	}

	state := utils.GenerateSecureSessionID()
	// Store state in a short-lived cookie to validate on callback
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   300, // 5 minutes
	})

	q := url.Values{}
	q.Set("client_id", clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("state", state)
	q.Set("access_type", "online")
	q.Set("include_granted_scopes", "true")

	authURL := "https://accounts.google.com/o/oauth2/v2/auth?" + q.Encode()
	http.Redirect(w, r, authURL, http.StatusFound)
}

// GoogleCallback handles the OAuth callback, exchanges code for tokens, and signs in
func (h *UserAuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Validate state
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	if state == "" || code == "" {
		utils.WriteError(w, http.StatusBadRequest, "Missing state or code")
		return
	}

	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != state {
		utils.WriteError(w, http.StatusBadRequest, "Invalid state")
		return
	}

	// Exchange code for tokens
	clientID := h.appConfig.GoogleClientID
	clientSecret := h.appConfig.GoogleClientSecret
	redirectURI := h.appConfig.GoogleRedirectURI
	if clientID == "" || clientSecret == "" || redirectURI == "" {
		utils.WriteError(w, http.StatusInternalServerError, "Google OAuth not configured")
		return
	}

	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)
	form.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", form)
	if err != nil {
		utils.WriteError(w, http.StatusBadGateway, "Failed to exchange code")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		utils.WriteError(w, http.StatusBadGateway, "Invalid token response from Google")
		return
	}

	var tokenRes struct {
		AccessToken  string `json:"access_token"`
		IDToken      string `json:"id_token"`
		ExpiresIn    int    `json:"expires_in"`
		TokenType    string `json:"token_type"`
		Scope        string `json:"scope"`
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenRes); err != nil {
		utils.WriteError(w, http.StatusBadGateway, "Failed to parse token response")
		return
	}

	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)
	userAgent := r.UserAgent()

	response, err := h.userService.SigninWithGoogleIDToken(tokenRes.IDToken, clientIP, userAgent)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Clear state cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	// Set jwt cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.ExpiresAt).Seconds()),
	})

	// Determine redirect target based on existing roles
	var frontend string
	if len(h.appConfig.CORSAllowedOrigins) > 0 {
		frontend = strings.TrimSpace(h.appConfig.CORSAllowedOrigins[0])
	}
	frontend = strings.TrimSpace(frontend)
	if frontend == "" {
		frontend = "http://localhost:3000"
	}

	// Default to homepage for returning users; role onboarding for new users
	redirectPath := "/"
	if me, err := h.userService.GetCurrentUser(response.Token); err == nil {
		roles := me.Roles
		if !roles.Buyer && !roles.Seller {
			redirectPath = "/signup/role?from=signup"
		} else {
			redirectPath = "/"
		}
	} else {
		// If we cannot determine roles, use safe default
		redirectPath = "/"
	}

	http.Redirect(w, r, frontend+redirectPath, http.StatusFound)
}

// Signout handles user sign out requests
func (h *UserAuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusBadRequest, err.Error())
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

	utils.WriteJSON(w, http.StatusOK, nil, response)
}

// Me handles getting current user information
func (h *UserAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	utils.WriteJSON(w, http.StatusOK, response, "")
}

// RefreshToken handles token refresh requests
func (h *UserAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
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
		utils.WriteError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	utils.WriteJSON(w, http.StatusOK, response, "")
}

// ChangePassword handles password change requests
func (h *UserAuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user from cookie
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	user, err := h.userService.ValidateUserSession(cookie.Value)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Invalid session")
		return
	}

	// Parse request body
	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if req.CurrentPassword == "" || req.NewPassword == "" {
		utils.WriteError(w, http.StatusBadRequest, "Current password and new password are required")
		return
	}

	if len(req.NewPassword) < 6 {
		utils.WriteError(w, http.StatusBadRequest, "New password must be at least 6 characters")
		return
	}

	// Change password via service
	err = h.userService.ChangePassword(user.ID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Password changed successfully")
}

// getClientIP extracts the client IP address from the request
// (removed) getClientIP: use utils.ExtractClientIP for a single, shared implementation

// ForgotPassword handles forgot password requests
func (h *UserAuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Basic validation
	if req.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, "Email is required")
		return
	}

	// Request password reset
	err := h.userService.RequestPasswordReset(req.Email)
	if err != nil {
		if strings.Contains(err.Error(), "email not found") {
			utils.WriteError(w, http.StatusNotFound, "Email not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to process password reset request")
		return
	}

	// Return success message
	utils.WriteJSON(w, http.StatusOK, nil, "Password reset link has been sent to your email")
}

// ResetPassword handles password reset with token
func (h *UserAuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if req.Token == "" || req.NewPassword == "" {
		utils.WriteError(w, http.StatusBadRequest, "Token and new password are required")
		return
	}

	if len(req.NewPassword) < 6 {
		utils.WriteError(w, http.StatusBadRequest, "Password must be at least 6 characters long")
		return
	}

	// Reset password
	err := h.userService.ResetPasswordWithToken(req.Token, req.NewPassword)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Password reset successfully. Please sign in with your new password.")
}
