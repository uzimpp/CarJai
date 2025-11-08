package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockRecentViewsService is a mock implementation of RecentViewsService for testing
type mockRecentViewsService struct {
	recordViewFunc      func(userID, carID int) error
	getUserRecentViewsFunc func(userID, limit int) ([]models.RecentViewWithCar, error)
}

func (m *mockRecentViewsService) RecordView(userID, carID int) error {
	if m.recordViewFunc != nil {
		return m.recordViewFunc(userID, carID)
	}
	return nil
}

func (m *mockRecentViewsService) GetUserRecentViews(userID, limit int) ([]models.RecentViewWithCar, error) {
	if m.getUserRecentViewsFunc != nil {
		return m.getUserRecentViewsFunc(userID, limit)
	}
	return nil, nil
}

func TestRecentViewsHandler_RecordView(t *testing.T) {
	tests := []struct {
		name              string
		method            string
		userID            int
		requestBody       interface{}
		isBuyer           bool
		getRolesFunc      func(userID int) (*models.UserRoles, error)
		recordViewFunc    func(userID, carID int) error
		expectedStatus    int
	}{
		{
			name:   "Successful record",
			method: "POST",
			userID: 1,
			requestBody: models.RecentViewRequest{
				CarID: 1,
			},
			isBuyer: true,
			getRolesFunc: func(userID int) (models.UserRoles, error) {
				return models.UserRoles{Buyer: true}, nil
			},
			recordViewFunc: func(userID, carID int) error {
				return nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Not a buyer",
			method: "POST",
			userID: 1,
			requestBody: models.RecentViewRequest{
				CarID: 1,
			},
			isBuyer: false,
			getRolesFunc: func(userID int) (models.UserRoles, error) {
				return models.UserRoles{Buyer: false}, nil
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Unauthorized",
			method:         "POST",
			userID:         0,
			requestBody:    models.RecentViewRequest{CarID: 1},
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:   "Invalid car ID",
			method: "POST",
			userID: 1,
			requestBody: models.RecentViewRequest{
				CarID: 0,
			},
			isBuyer: true,
			getRolesFunc: func(userID int) (models.UserRoles, error) {
				return models.UserRoles{Buyer: true}, nil
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			userID:         1,
			requestBody:    models.RecentViewRequest{CarID: 1},
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRecentViewsService := &mockRecentViewsService{
				recordViewFunc: tt.recordViewFunc,
			}
			mockProfileService := &mockProfileService{
				getRolesForUserFunc: tt.getRolesFunc,
			}

			handler := &testRecentViewsHandler{
				recentViewsService: mockRecentViewsService,
				profileService:     mockProfileService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				reqBody, _ = json.Marshal(tt.requestBody)
			}
			req := httptest.NewRequest(tt.method, "/api/recent-views", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			ctx := context.WithValue(req.Context(), "userID", tt.userID)
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.RecordView(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testRecentViewsHandler struct {
	recentViewsService *mockRecentViewsService
	profileService     *mockProfileService
}

func (h *testRecentViewsHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	roles, err := h.profileService.GetRolesForUser(userID)
	if err != nil || !roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Only buyers can record recent views")
		return
	}

	var req models.RecentViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.CarID <= 0 {
		response := models.RecordViewResponse{
			Success: false,
			Message: "Invalid car ID",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	err = h.recentViewsService.RecordView(userID, req.CarID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to record view: "+err.Error())
		return
	}

	response := models.RecordViewResponse{
		Success: true,
		Message: "View recorded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func TestRecentViewsHandler_GetRecentViews(t *testing.T) {
	tests := []struct {
		name                  string
		method                string
		userID                int
		limit                 string
		isBuyer               bool
		getRolesFunc          func(userID int) (models.UserRoles, error)
		getUserRecentViewsFunc func(userID, limit int) ([]models.RecentViewWithCar, error)
		expectedStatus        int
	}{
		{
			name:   "Successful get",
			method: "GET",
			userID: 1,
			limit:  "20",
			isBuyer: true,
			getRolesFunc: func(userID int) (models.UserRoles, error) {
				return models.UserRoles{Buyer: true}, nil
			},
			getUserRecentViewsFunc: func(userID, limit int) ([]models.RecentViewWithCar, error) {
				return []models.RecentViewWithCar{}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Not a buyer",
			method: "GET",
			userID: 1,
			isBuyer: false,
			getRolesFunc: func(userID int) (models.UserRoles, error) {
				return models.UserRoles{Buyer: false}, nil
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			userID:         1,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRecentViewsService := &mockRecentViewsService{
				getUserRecentViewsFunc: tt.getUserRecentViewsFunc,
			}
			mockProfileService := &mockProfileService{
				getRolesForUserFunc: tt.getRolesFunc,
			}

			handler := &testRecentViewsHandler{
				recentViewsService: mockRecentViewsService,
				profileService:     mockProfileService,
			}

			req := httptest.NewRequest(tt.method, "/api/recent-views?limit="+tt.limit, nil)
			ctx := context.WithValue(req.Context(), "userID", tt.userID)
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.GetRecentViews(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testRecentViewsHandler) GetRecentViews(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	roles, err := h.profileService.GetRolesForUser(userID)
	if err != nil || !roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Only buyers can access recent views")
		return
	}

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := parseInt(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	recentViews, err := h.recentViewsService.GetUserRecentViews(userID, limit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get recent views: "+err.Error())
		return
	}

	response := models.RecentViewsResponse{
		Success: true,
		Data:    recentViews,
		Message: "Recent views retrieved successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Helper function for parsing int (simplified for test)
func parseInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}

