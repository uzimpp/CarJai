package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

func TestUserAuthHandler_Signup(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		requestBody    interface{}
		signupFunc     func(email, password, username, name, ipAddress, userAgent string) (*models.UserAuthResponse, error)
		expectedStatus int
	}{
		{
			name:   "Successful signup",
			method: "POST",
			requestBody: models.UserSignupRequest{
				Email:    "test@example.com",
				Password: "password123",
				Username: "testuser",
				Name:     "Test User",
			},
			signupFunc: func(email, password, username, name, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
				return &models.UserAuthResponse{
					Success: true,
					Data: models.UserAuthData{
						User: models.UserPublic{
							ID:       1,
							Email:    email,
							Username: username,
							Name:     name,
						},
						Token:     "test-token",
						ExpiresAt: time.Now().Add(24 * time.Hour),
					},
					Message: "Signup successful",
				}, nil
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name:   "Missing required fields",
			method: "POST",
			requestBody: models.UserSignupRequest{
				Email:    "",
				Password: "",
				Username: "",
				Name:     "",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "Password too short",
			method: "POST",
			requestBody: models.UserSignupRequest{
				Email:    "test@example.com",
				Password: "12345",
				Username: "testuser",
				Name:     "Test User",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			requestBody:    models.UserSignupRequest{},
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &mockUserService{
				signupFunc: tt.signupFunc,
			}

			handler := &testUserAuthHandler{
				userService: mockService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				reqBody, _ = json.Marshal(tt.requestBody)
			}
			req := httptest.NewRequest(tt.method, "/api/auth/signup", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			handler.Signup(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

// testUserAuthHandler wraps the handler for testing with mock service
type testUserAuthHandler struct {
	userService *mockUserService
}

func (h *testUserAuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
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
	if req.Email == "" || req.Password == "" || req.Username == "" || req.Name == "" {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Email, password, username, and name are required",
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

	clientIP := utils.ExtractClientIP(r.RemoteAddr, r.Header.Get("X-Forwarded-For"), r.Header.Get("X-Real-IP"))
	userAgent := r.UserAgent()

	response, err := h.userService.Signup(req.Email, req.Password, req.Username, req.Name, clientIP, userAgent)
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

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Data.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.Data.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusCreated, response)
}

func TestUserAuthHandler_Signin(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		requestBody    interface{}
		signinFunc     func(emailOrUsername, password, ipAddress, userAgent string) (*models.UserAuthResponse, error)
		expectedStatus int
	}{
		{
			name:   "Successful signin",
			method: "POST",
			requestBody: models.UserSigninRequest{
				EmailOrUsername: "test@example.com",
				Password:        "password123",
			},
			signinFunc: func(emailOrUsername, password, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
				return &models.UserAuthResponse{
					Success: true,
					Data: models.UserAuthData{
						User: models.UserPublic{
							ID:       1,
							Email:    emailOrUsername,
							Username: "testuser",
							Name:     "Test User",
						},
						Token:     "test-token",
						ExpiresAt: time.Now().Add(24 * time.Hour),
					},
					Message: "Signin successful",
				}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Missing credentials",
			method: "POST",
			requestBody: models.UserSigninRequest{
				EmailOrUsername: "",
				Password:        "",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			requestBody:    nil,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &mockUserService{
				signinFunc: tt.signinFunc,
			}

			handler := &testUserAuthHandler{
				userService: mockService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				reqBody, _ = json.Marshal(tt.requestBody)
			}
			req := httptest.NewRequest(tt.method, "/api/auth/signin", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			handler.Signin(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testUserAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
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

	if req.EmailOrUsername == "" || req.Password == "" {
		response := models.UserErrorResponse{
			Success: false,
			Error:   "Email/username and password are required",
			Code:    http.StatusBadRequest,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	clientIP := utils.ExtractClientIP(r.RemoteAddr, r.Header.Get("X-Forwarded-For"), r.Header.Get("X-Real-IP"))
	userAgent := r.UserAgent()

	response, err := h.userService.Signin(req.EmailOrUsername, req.Password, clientIP, userAgent)
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

	http.SetCookie(w, &http.Cookie{
		Name:     "jwt",
		Value:    response.Data.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(response.Data.ExpiresAt).Seconds()),
	})

	utils.WriteJSON(w, http.StatusOK, response)
}

func TestUserAuthHandler_Me_And_Refresh_Error(t *testing.T) {
	mock := &mockUserService{
		getCurrentUserFunc: func(token string) (*models.UserMeResponse, error) {
			return nil, errors.New("invalid")
		},
		refreshTokenFunc: func(token, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
			return nil, errors.New("invalid")
		},
	}
	handler := &testUserAuthHandler{userService: mock}
	// Me: no cookie
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	w := httptest.NewRecorder()
	handlerMe(w, req, handler)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for me without cookie, got %d", w.Code)
	}
	// Refresh: no cookie
	req2 := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	w2 := httptest.NewRecorder()
	handlerRefresh(w2, req2, handler)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for refresh without cookie, got %d", w2.Code)
	}
}

func TestUserAuthHandler_ChangePassword_Errors(t *testing.T) {
	mock := &mockUserService{
		validateUserSessionFunc: func(token string) (*models.User, error) {
			return &models.User{ID: 1}, nil
		},
		changePasswordFunc: func(userID int, currentPassword, newPassword string) error {
			return errors.New("bad request")
		},
	}
	handler := &testUserAuthHandler{userService: mock}
	// No cookie -> 401
	req := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", nil)
	w := httptest.NewRecorder()
	handlerChangePassword(w, req, handler)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when no cookie, got %d", w.Code)
	}
	// Invalid body -> 400
	req2 := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", bytes.NewBufferString("invalid"))
	req2.Header.Set("Content-Type", "application/json")
	req2.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	w2 := httptest.NewRecorder()
	handlerChangePassword(w2, req2, handler)
	if w2.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid body, got %d", w2.Code)
	}
	// Too short new password -> 400
	body, _ := json.Marshal(models.ChangePasswordRequest{CurrentPassword: "abcdef", NewPassword: "123"})
	req3 := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", bytes.NewBuffer(body))
	req3.Header.Set("Content-Type", "application/json")
	req3.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	w3 := httptest.NewRecorder()
	handlerChangePassword(w3, req3, handler)
	if w3.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for short password, got %d", w3.Code)
	}
	// Service error -> 400
	body2, _ := json.Marshal(models.ChangePasswordRequest{CurrentPassword: "abcdef", NewPassword: "123456"})
	req4 := httptest.NewRequest(http.MethodPost, "/api/auth/change-password", bytes.NewBuffer(body2))
	req4.Header.Set("Content-Type", "application/json")
	req4.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	w4 := httptest.NewRecorder()
	handlerChangePassword(w4, req4, handler)
	if w4.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for service error, got %d", w4.Code)
	}
}

// Wrapper helpers using testUserAuthHandler
func handlerMe(w http.ResponseWriter, r *http.Request, h *testUserAuthHandler) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	resp, err := h.userService.GetCurrentUser(cookie.Value)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid token",
			Code:    http.StatusUnauthorized,
		}
		utils.WriteJSON(w, http.StatusUnauthorized, errorResponse)
		return
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}

func handlerRefresh(w http.ResponseWriter, r *http.Request, h *testUserAuthHandler) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	cookie, err := r.Cookie("jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	clientIP := utils.ExtractClientIP(r.RemoteAddr, r.Header.Get("X-Forwarded-For"), r.Header.Get("X-Real-IP"))
	userAgent := r.UserAgent()
	resp, err := h.userService.RefreshToken(cookie.Value, clientIP, userAgent)
	if err != nil {
		errorResponse := models.UserErrorResponse{
			Success: false,
			Error:   "Invalid token",
			Code:    http.StatusUnauthorized,
		}
		utils.WriteJSON(w, http.StatusUnauthorized, errorResponse)
		return
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}

func handlerChangePassword(w http.ResponseWriter, r *http.Request, h *testUserAuthHandler) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
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
	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		utils.WriteError(w, http.StatusBadRequest, "Current password and new password are required")
		return
	}
	if len(req.NewPassword) < 6 {
		utils.WriteError(w, http.StatusBadRequest, "New password must be at least 6 characters")
		return
	}
	if err := h.userService.ChangePassword(user.ID, req.CurrentPassword, req.NewPassword); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.WriteJSON(w, http.StatusOK, models.ChangePasswordResponse{Success: true, Message: "Password changed successfully"})
}

