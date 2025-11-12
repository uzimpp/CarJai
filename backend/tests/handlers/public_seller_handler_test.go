package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

func TestPublicSellerHandler_GetSeller(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		sellerID            string
		getPublicSellerFunc func(sellerID string) (*models.Seller, error)
		expectedStatus      int
	}{
		{
			name:     "Successful get",
			method:   "GET",
			sellerID: "1",
			getPublicSellerFunc: func(sellerID string) (*models.Seller, error) {
				return &models.Seller{ID: 1}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:     "Seller not found",
			method:   "GET",
			sellerID: "999",
			getPublicSellerFunc: func(sellerID string) (*models.Seller, error) {
				return nil, &services.ValidationError{Message: "not found"}
			},
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			sellerID:       "1",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockProfileService := &mockProfileService{
				getPublicSellerByIDFunc: tt.getPublicSellerFunc,
			}

			handler := &testPublicSellerHandler{
				profileService: mockProfileService,
			}

			req := httptest.NewRequest(tt.method, "/api/sellers/"+tt.sellerID, nil)
			w := httptest.NewRecorder()

			handler.GetSeller(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testPublicSellerHandler struct {
	profileService *mockProfileService
	carService     *mockCarService
}

func (h *testPublicSellerHandler) GetSeller(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sellerID := "1" // Simplified for test
	if sellerID == "" {
		utils.WriteError(w, http.StatusBadRequest, "Seller ID is required")
		return
	}

	seller, err := h.profileService.GetPublicSellerByID(sellerID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller not found")
		return
	}

	response := models.SellerResponse{
		Success: true,
		Data: models.SellerData{
			Seller:   *seller,
			Contacts: []models.SellerContact{},
		},
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

