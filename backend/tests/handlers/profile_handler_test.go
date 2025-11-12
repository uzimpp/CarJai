package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockProfileService is defined in mocks.go

func TestProfileHandler_Profile(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		hasCookie           bool
		cookieValue         string
		validateSessionFunc func(token string) (*models.User, error)
		getFullProfileFunc  func(userID int, user *models.User) (*models.ProfileData, error)
		expectedStatus      int
	}{
		{
			name:      "Successful get",
			method:    "GET",
			hasCookie: true,
			cookieValue: "test-token",
			validateSessionFunc: func(token string) (*models.User, error) {
				return &models.User{ID: 1, Username: "testuser"}, nil
			},
			getFullProfileFunc: func(userID int, user *models.User) (*models.ProfileData, error) {
				return &models.ProfileData{}, nil
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
			mockProfileService := &mockProfileService{
				getFullProfileFunc: tt.getFullProfileFunc,
			}
			mockUserService := &mockUserService{
				validateUserSessionFunc: tt.validateSessionFunc,
			}

			handler := &testProfileHandler{
				profileService: mockProfileService,
				userService:    mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/profile/", nil)
			if tt.hasCookie {
				req.AddCookie(&http.Cookie{
					Name:  "jwt",
					Value: tt.cookieValue,
				})
			}
			w := httptest.NewRecorder()

			handler.Profile(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testProfileHandler struct {
	profileService *mockProfileService
	userService    *mockUserService
}

func (h *testProfileHandler) Profile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
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

	profileData, err := h.profileService.GetFullProfile(user.ID, user)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	response := models.ProfileResponse{
		Success: true,
		Data:    *profileData,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

func TestProfileHandler_UpdateSelf_Errors(t *testing.T) {
	mockUser := &mockUserService{
		validateUserSessionFunc: func(token string) (*models.User, error) {
			return &models.User{ID: 1, Username: "current"}, nil
		},
		getUserByUsernameFunc: func(username string) (*models.User, error) {
			// Simulate username taken
			if username == "taken" {
				return &models.User{ID: 2, Username: "taken"}, nil
			}
			return nil, nil
		},
		updateUserFunc: func(userID int, username *string, name *string) (*models.User, error) {
			return nil, &services.ValidationError{Message: "update failed"}
		},
	}
	handler := &ProfileHandler{
		userService: mockUser,
	}
	// Method not allowed
	req0 := httptest.NewRequest(http.MethodGet, "/api/profile/self", nil)
	w0 := httptest.NewRecorder()
	handler.UpdateSelf(w0, req0)
	if w0.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w0.Code)
	}
	// No cookie
	req := httptest.NewRequest(http.MethodPatch, "/api/profile/self", nil)
	w := httptest.NewRecorder()
	handler.UpdateSelf(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for no cookie, got %d", w.Code)
	}
	// Invalid body
	req2 := httptest.NewRequest(http.MethodPatch, "/api/profile/self", bytes.NewBufferString("invalid"))
	req2.Header.Set("Content-Type", "application/json")
	req2.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	w2 := httptest.NewRecorder()
	handler.UpdateSelf(w2, req2)
	if w2.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid body, got %d", w2.Code)
	}
	// Username taken
	bodyTaken, _ := json.Marshal(models.UserUpdateSelfRequest{Username: strPtr("taken")})
	req3 := httptest.NewRequest(http.MethodPatch, "/api/profile/self", bytes.NewBuffer(bodyTaken))
	req3.Header.Set("Content-Type", "application/json")
	req3.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	w3 := httptest.NewRecorder()
	handler.UpdateSelf(w3, req3)
	if w3.Code != http.StatusBadRequest {
		t.Errorf("expected 400 when username taken, got %d", w3.Code)
	}
	// Update failed (server error)
	bodyOK, _ := json.Marshal(models.UserUpdateSelfRequest{Name: strPtr("New Name")})
	req4 := httptest.NewRequest(http.MethodPatch, "/api/profile/self", bytes.NewBuffer(bodyOK))
	req4.Header.Set("Content-Type", "application/json")
	req4.AddCookie(&http.Cookie{Name: "jwt", Value: "token"})
	// For update to be called, ensure username not taken
	mockUser.getUserByUsernameFunc = func(username string) (*models.User, error) { return nil, nil }
	w4 := httptest.NewRecorder()
	handler.UpdateSelf(w4, req4)
	if w4.Code != http.StatusInternalServerError {
		t.Errorf("expected 500 when update fails, got %d", w4.Code)
	}
}

func strPtr(s string) *string { return &s }

func TestProfileHandler_GetBuyerProfile(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		hasCookie           bool
		cookieValue         string
		validateSessionFunc func(token string) (*models.User, error)
		getBuyerFunc        func(userID int) (*models.Buyer, error)
		expectedStatus      int
	}{
		{
			name:      "Successful get",
			method:    "GET",
			hasCookie: true,
			cookieValue: "test-token",
			validateSessionFunc: func(token string) (*models.User, error) {
				return &models.User{ID: 1}, nil
			},
			getBuyerFunc: func(userID int) (*models.Buyer, error) {
				return &models.Buyer{ID: 1}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:      "Buyer not found",
			method:    "GET",
			hasCookie: true,
			cookieValue: "test-token",
			validateSessionFunc: func(token string) (*models.User, error) {
				return &models.User{ID: 1}, nil
			},
			getBuyerFunc: func(userID int) (*models.Buyer, error) {
				return nil, &services.ValidationError{Message: "not found"}
			},
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockProfileService := &mockProfileService{
				getBuyerByUserIDFunc: tt.getBuyerFunc,
			}
			mockUserService := &mockUserService{
				validateUserSessionFunc: tt.validateSessionFunc,
			}

			handler := &testProfileHandler{
				profileService: mockProfileService,
				userService:    mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/profile/buyer", nil)
			if tt.hasCookie {
				req.AddCookie(&http.Cookie{
					Name:  "jwt",
					Value: tt.cookieValue,
				})
			}
			w := httptest.NewRecorder()

			handler.GetBuyerProfile(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testProfileHandler) GetBuyerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
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

	buyer, err := h.profileService.GetBuyerByUserID(user.ID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Buyer profile not found")
		return
	}

	response := models.BuyerResponse{
		Success: true,
		Data:    *buyer,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

func TestProfileHandler_UpsertBuyerProfile(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		hasCookie           bool
		cookieValue         string
		requestBody         interface{}
		validateSessionFunc func(token string) (*models.User, error)
		upsertBuyerFunc     func(userID int, req models.BuyerRequest) (*models.Buyer, error)
		expectedStatus      int
	}{
		{
			name:      "Successful upsert",
			method:    "PUT",
			hasCookie: true,
			cookieValue: "test-token",
			requestBody: models.BuyerRequest{},
			validateSessionFunc: func(token string) (*models.User, error) {
				return &models.User{ID: 1}, nil
			},
			upsertBuyerFunc: func(userID int, req models.BuyerRequest) (*models.Buyer, error) {
				return &models.Buyer{ID: 1}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid request body",
			method:         "PUT",
			hasCookie:      true,
			cookieValue:     "test-token",
			requestBody:    "invalid json",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockProfileService := &mockProfileService{
				upsertBuyerFunc: tt.upsertBuyerFunc,
			}
			mockUserService := &mockUserService{
				validateUserSessionFunc: tt.validateSessionFunc,
			}

			handler := &testProfileHandler{
				profileService: mockProfileService,
				userService:    mockUserService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				if str, ok := tt.requestBody.(string); ok {
					reqBody = []byte(str)
				} else {
					reqBody, _ = json.Marshal(tt.requestBody)
				}
			}
			req := httptest.NewRequest(tt.method, "/api/profile/buyer", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			if tt.hasCookie {
				req.AddCookie(&http.Cookie{
					Name:  "jwt",
					Value: tt.cookieValue,
				})
			}
			w := httptest.NewRecorder()

			handler.UpsertBuyerProfile(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testProfileHandler) UpsertBuyerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
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

	var req models.BuyerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	buyer, err := h.profileService.UpsertBuyer(user.ID, req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response := models.BuyerResponse{
		Success: true,
		Data:    *buyer,
		Message: "Buyer profile updated successfully",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

