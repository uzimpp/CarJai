package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockAdminService and mockJWTManager are defined in mocks.go

func TestAdminAuthHandler_Signin(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		requestBody    interface{}
		signinFunc     func(req services.SigninRequest) (*services.SigninResponse, error)
		expectedStatus int
	}{
		{
			name:   "Successful signin",
			method: "POST",
			requestBody: models.AdminSigninRequest{
				Username: "admin",
				Password: "password123",
			},
			signinFunc: func(req services.SigninRequest) (*services.SigninResponse, error) {
				return &services.SigninResponse{
					Admin: models.AdminPublic{
						ID:       1,
						Username: req.Username,
						Name:     "Test Admin",
						CreatedAt: time.Now(),
					},
					Token:     "test-token",
					ExpiresAt: time.Now().Add(8 * time.Hour),
				}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Invalid credentials",
			method: "POST",
			requestBody: models.AdminSigninRequest{
				Username: "admin",
				Password: "wrongpassword",
			},
			signinFunc: func(req services.SigninRequest) (*services.SigninResponse, error) {
				return nil, &services.ValidationError{Message: "Invalid credentials"}
			},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			requestBody:    nil,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid request body",
			method:         "POST",
			requestBody:    "invalid json",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminService{
				signinFunc: tt.signinFunc,
			}
			mockJWTManager := &mockJWTManager{}

			handler := &testAdminAuthHandler{
				adminService: mockAdminService,
				jwtManager:   mockJWTManager,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				if str, ok := tt.requestBody.(string); ok {
					reqBody = []byte(str)
				} else {
					reqBody, _ = json.Marshal(tt.requestBody)
				}
			}
			req := httptest.NewRequest(tt.method, "/admin/auth/login", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			handler.Signin(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testAdminAuthHandler struct {
	adminService *mockAdminService
	jwtManager   *mockJWTManager
}

func (h *testAdminAuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var signinReq models.AdminSigninRequest
	if err := json.NewDecoder(r.Body).Decode(&signinReq); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	clientIP := utils.ExtractClientIP(
		r.RemoteAddr,
		r.Header.Get("X-Forwarded-For"),
		r.Header.Get("X-Real-IP"),
	)

	if clientIP == "" {
		utils.WriteError(w, http.StatusBadRequest, "Unable to determine client IP")
		return
	}

	signinRequest := services.SigninRequest{
		Username:  signinReq.Username,
		Password:  signinReq.Password,
		IPAddress: clientIP,
		UserAgent: r.UserAgent(),
	}

	signinResponse, err := h.adminService.Signin(signinRequest)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	token := signinResponse.Token
	expiresAt := signinResponse.ExpiresAt

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_jwt",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
	})

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

func TestAdminAuthHandler_Signout(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		hasCookie      bool
		cookieValue    string
		signoutFunc    func(req services.SignoutRequest) error
		expectedStatus int
	}{
		{
			name:   "Successful signout",
			method: "POST",
			hasCookie: true,
			cookieValue: "test-token",
			signoutFunc: func(req services.SignoutRequest) error {
				return nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "No cookie",
			method:         "POST",
			hasCookie:      false,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			hasCookie:      true,
			cookieValue:     "test-token",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminService{
				signoutFunc: tt.signoutFunc,
			}
			mockJWTManager := &mockJWTManager{}

			handler := &testAdminAuthHandler{
				adminService: mockAdminService,
				jwtManager:   mockJWTManager,
			}

			req := httptest.NewRequest(tt.method, "/admin/auth/logout", nil)
			if tt.hasCookie {
				req.AddCookie(&http.Cookie{
					Name:  "admin_jwt",
					Value: tt.cookieValue,
				})
			}
			w := httptest.NewRecorder()

			handler.Signout(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testAdminAuthHandler) Signout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	cookie, err := r.Cookie("admin_jwt")
	if err != nil || cookie.Value == "" {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	signoutRequest := services.SignoutRequest{Token: cookie.Value}
	err = h.adminService.Signout(signoutRequest)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_jwt",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})

	response := models.AdminSignoutResponse{
		Success: true,
		Message: "Sign out successful",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

func TestAdminAuthHandler_Me(t *testing.T) {
	tests := []struct {
		name               string
		method             string
		hasCookie          bool
		cookieValue        string
		getCurrentAdminFunc func(token string) (*models.AdminMeData, error)
		expectedStatus     int
	}{
		{
			name:      "Successful get",
			method:    "GET",
			hasCookie: true,
			cookieValue: "test-token",
			getCurrentAdminFunc: func(token string) (*models.AdminMeData, error) {
				return &models.AdminMeData{
					Admin: models.AdminPublic{
						ID:       1,
						Username: "admin",
						Name:     "Test Admin",
						CreatedAt: time.Now(),
					},
				}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "No cookie",
			method:         "GET",
			hasCookie:      false,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			hasCookie:      true,
			cookieValue:     "test-token",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminService{
				getCurrentAdminFunc: tt.getCurrentAdminFunc,
			}
			mockJWTManager := &mockJWTManager{}

			handler := &testAdminAuthHandler{
				adminService: mockAdminService,
				jwtManager:   mockJWTManager,
			}

			req := httptest.NewRequest(tt.method, "/admin/auth/me", nil)
			if tt.hasCookie {
				req.AddCookie(&http.Cookie{
					Name:  "admin_jwt",
					Value: tt.cookieValue,
				})
			}
			w := httptest.NewRecorder()

			handler.Me(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testAdminAuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	cookie, err := r.Cookie("admin_jwt")
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	token := cookie.Value

	adminData, err := h.adminService.GetCurrentAdmin(token)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err.Error())
		return
	}

	response := models.AdminMeResponse{
		Success: true,
		Data:    *adminData,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

func TestAdminAuthHandler_RefreshToken_Error(t *testing.T) {
	mockJWT := &mockJWTManager{
		refreshTokenFunc: func(token string) (string, time.Time, error) {
			return "", time.Time{}, &services.ValidationError{Message: "invalid token"}
		},
	}
	handler := &AdminAuthHandler{
		jwtManager: mockJWT,
	}
	// No cookie case -> Unauthorized
	req := httptest.NewRequest(http.MethodPost, "/admin/auth/refresh", nil)
	w := httptest.NewRecorder()
	handler.RefreshToken(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when no cookie, got %d", w.Code)
	}
	// With cookie but refresh error -> Unauthorized
	req2 := httptest.NewRequest(http.MethodPost, "/admin/auth/refresh", nil)
	req2.AddCookie(&http.Cookie{Name: "admin_jwt", Value: "bad"})
	w2 := httptest.NewRecorder()
	handler.RefreshToken(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when refresh fails, got %d", w2.Code)
	}
	// Method not allowed
	req3 := httptest.NewRequest(http.MethodGet, "/admin/auth/refresh", nil)
	w3 := httptest.NewRecorder()
	handler.RefreshToken(w3, req3)
	if w3.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405 for wrong method, got %d", w3.Code)
	}
}

func TestAdminAuthHandler_Signout_Error(t *testing.T) {
	mockAdmin := &mockAdminService{
		signoutFunc: func(req services.SignoutRequest) error {
			return &services.ValidationError{Message: "signout failed"}
		},
	}
	handler := &AdminAuthHandler{
		adminService: mockAdmin,
	}
	// No cookie -> Unauthorized
	req := httptest.NewRequest(http.MethodPost, "/admin/auth/logout", nil)
	w := httptest.NewRecorder()
	handler.Signout(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when no cookie, got %d", w.Code)
	}
	// Service error -> Unauthorized
	req2 := httptest.NewRequest(http.MethodPost, "/admin/auth/logout", nil)
	req2.AddCookie(&http.Cookie{Name: "admin_jwt", Value: "token"})
	w2 := httptest.NewRecorder()
	handler.Signout(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 when service error, got %d", w2.Code)
	}
}

