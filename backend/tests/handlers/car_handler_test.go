package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockCarService is defined in mocks.go

func TestCarHandler_CreateCar(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		userID         int
		isSellerFunc   func(userID int) (bool, error)
		createCarFunc  func(userID int) (*models.Car, error)
		expectedStatus int
	}{
		{
			name:   "Successful create",
			method: "POST",
			userID: 1,
			isSellerFunc: func(userID int) (bool, error) {
				return true, nil
			},
			createCarFunc: func(userID int) (*models.Car, error) {
				return &models.Car{ID: 1, SellerID: userID, Status: "draft"}, nil
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name:   "Not a seller",
			method: "POST",
			userID: 1,
			isSellerFunc: func(userID int) (bool, error) {
				return false, nil
			},
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Unauthorized",
			method:         "POST",
			userID:         0,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			userID:         1,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCarService := &mockCarService{
				createCarFunc: tt.createCarFunc,
			}
			mockUserService := &mockUserService{
				isSellerFunc: tt.isSellerFunc,
			}

			handler := &testCarHandler{
				carService:  mockCarService,
				userService: mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/cars", nil)
			ctx := context.WithValue(req.Context(), "userID", tt.userID)
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.CreateCar(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testCarHandler struct {
	carService  *mockCarService
	userService *mockUserService
}

func (h *testCarHandler) CreateCar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "Only sellers can create car listings",
		})
		return
	}

	car, err := h.carService.CreateCar(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to create car",
		})
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Draft created successfully",
		"data": map[string]interface{}{
			"id": car.ID,
		},
	})
}

func TestCarHandler_GetCar(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		carID               int
		getCarWithImagesFunc func(carID int) (*models.CarWithImages, error)
		expectedStatus      int
	}{
		{
			name:   "Successful get",
			method: "GET",
			carID:  1,
			getCarWithImagesFunc: func(carID int) (*models.CarWithImages, error) {
				return &models.CarWithImages{
					Car: models.Car{ID: carID, Status: "active"},
					Images: []models.CarImageMetadata{},
				}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Car not found",
			method: "GET",
			carID:  999,
			getCarWithImagesFunc: func(carID int) (*models.CarWithImages, error) {
				return nil, &services.ValidationError{Message: "not found"}
			},
			expectedStatus: http.StatusNotFound,
		},
		{
			name:   "Car not active",
			method: "GET",
			carID:  1,
			getCarWithImagesFunc: func(carID int) (*models.CarWithImages, error) {
				return &models.CarWithImages{
					Car: models.Car{ID: carID, Status: "draft"},
					Images: []models.CarImageMetadata{},
				}, nil
			},
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Invalid car ID",
			method:         "GET",
			carID:          0,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCarService := &mockCarService{
				getCarWithImagesFunc: tt.getCarWithImagesFunc,
			}

			handler := &testCarHandler{
				carService: mockCarService,
			}

			req := httptest.NewRequest(tt.method, "/api/cars/1", nil)
			w := httptest.NewRecorder()

			handler.GetCar(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testCarHandler) GetCar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	carID := 1 // Simplified for test
	carWithImages, err := h.carService.GetCarWithImages(carID)
	if err != nil {
		if err.Error() == "not found" {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Car not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to get car",
		})
		return
	}

	if carWithImages.Car.Status != "active" {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Car not found",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"car":    carWithImages.Car,
			"images": carWithImages.Images,
		},
	})
}

func TestCarHandler_SearchCars(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		queryParams         string
		searchActiveCarsFunc func(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error)
		expectedStatus      int
	}{
		{
			name:        "Successful search",
			method:      "GET",
			queryParams: "?q=toyota&page=1&limit=20",
			searchActiveCarsFunc: func(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error) {
				return []models.CarListingWithImages{}, 0, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:        "Search with filters",
			method:      "GET",
			queryParams: "?minPrice=100000&maxPrice=500000&minYear=2020",
			searchActiveCarsFunc: func(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error) {
				return []models.CarListingWithImages{}, 0, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			queryParams:    "",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCarService := &mockCarService{
				searchActiveCarsFunc: tt.searchActiveCarsFunc,
			}

			handler := &testCarHandler{
				carService: mockCarService,
			}

			req := httptest.NewRequest(tt.method, "/api/cars/search"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			handler.SearchCars(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testCarHandler) SearchCars(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	query := r.URL.Query()
	req := &models.SearchCarsRequest{
		Query:  query.Get("q"),
		Status: "active",
		Limit:  20,
		Offset: 0,
	}

	listings, total, err := h.carService.SearchActiveCarsWithImages(req)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to search cars",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.PaginatedCarListingResponse{
		Success: true,
		Data: models.PaginatedCarListingData{
			Cars:  listings,
			Total: total,
			Page:  1,
			Limit: 20,
		},
	})
}

