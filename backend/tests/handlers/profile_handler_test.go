package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockProfileService is a mock implementation of ProfileService for testing
type mockProfileService struct {
	getFullProfileFunc    func(userID int, user *models.User) (*models.ProfileData, error)
	getBuyerByUserIDFunc  func(userID int) (*models.Buyer, error)
	upsertBuyerFunc       func(userID int, req models.BuyerRequest) (*models.Buyer, error)
	getSellerByUserIDFunc func(userID int) (*models.Seller, error)
	upsertSellerFunc      func(userID int, req models.SellerRequest) (*models.Seller, *[]models.SellerContact, error)
	getSellerContactsFunc func(sellerID int) ([]models.SellerContact, error)
	getRolesForUserFunc   func(userID int) (models.UserRoles, error)
	getPublicSellerByIDFunc func(sellerID string) (*models.Seller, error)
}

func (m *mockProfileService) GetFullProfile(userID int, user *models.User) (*models.ProfileData, error) {
	if m.getFullProfileFunc != nil {
		return m.getFullProfileFunc(userID, user)
	}
	return nil, nil
}

func (m *mockProfileService) GetBuyerByUserID(userID int) (*models.Buyer, error) {
	if m.getBuyerByUserIDFunc != nil {
		return m.getBuyerByUserIDFunc(userID)
	}
	return nil, nil
}

func (m *mockProfileService) UpsertBuyer(userID int, req models.BuyerRequest) (*models.Buyer, error) {
	if m.upsertBuyerFunc != nil {
		return m.upsertBuyerFunc(userID, req)
	}
	return nil, nil
}

func (m *mockProfileService) GetSellerByUserID(userID int) (*models.Seller, error) {
	if m.getSellerByUserIDFunc != nil {
		return m.getSellerByUserIDFunc(userID)
	}
	return nil, nil
}

func (m *mockProfileService) UpsertSeller(userID int, req models.SellerRequest) (*models.Seller, *[]models.SellerContact, error) {
	if m.upsertSellerFunc != nil {
		return m.upsertSellerFunc(userID, req)
	}
	return nil, nil, nil
}

func (m *mockProfileService) GetSellerContacts(sellerID int) ([]models.SellerContact, error) {
	if m.getSellerContactsFunc != nil {
		return m.getSellerContactsFunc(sellerID)
	}
	return nil, nil
}

func (m *mockProfileService) GetRolesForUser(userID int) (models.UserRoles, error) {
	if m.getRolesForUserFunc != nil {
		return m.getRolesForUserFunc(userID)
	}
	return models.UserRoles{}, nil
}

func (m *mockProfileService) GetPublicSellerByID(sellerID string) (*models.Seller, error) {
	if m.getPublicSellerByIDFunc != nil {
		return m.getPublicSellerByIDFunc(sellerID)
	}
	return nil, nil
}

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
				return &models.Buyer{UserID: userID}, nil
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
				return nil, &utils.ValidationError{Message: "not found"}
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
				return &models.Buyer{UserID: userID}, nil
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

