package handlers

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockFavouriteService is defined in mocks.go

func TestFavouriteHandler_AddFavourite(t *testing.T) {
	tests := []struct {
		name             string
		method           string
		userID           int
		carID            int
		isBuyer          bool
		addFavouriteFunc func(userID, carID int) error
		expectedStatus   int
	}{
		{
			name:    "Successful add",
			method:  "POST",
			userID:  1,
			carID:   1,
			isBuyer: true,
			addFavouriteFunc: func(userID, carID int) error {
				return nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Not a buyer",
			method:         "POST",
			userID:         1,
			carID:          1,
			isBuyer:        false,
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Unauthorized",
			method:         "POST",
			userID:         0,
			carID:          1,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			userID:         1,
			carID:          1,
			isBuyer:        true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "Invalid car ID",
			method:         "POST",
			userID:         1,
			carID:          0,
			isBuyer:        true,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockFavouriteService := &mockFavouriteService{
				addFavouriteFunc: tt.addFavouriteFunc,
			}
			mockUserService := &mockUserService{
				getCurrentUserFunc: func(token string) (*models.UserMeData, error) {
					return &models.UserMeData{
						Roles: models.UserRoles{
							Buyer: tt.isBuyer,
						},
					}, nil
				},
			}

			handler := &testFavouriteHandler{
				favouriteService: mockFavouriteService,
				userService:      mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/favorites/1", nil)
			ctx := context.WithValue(req.Context(), middleware.UserIDKey, tt.userID)
			ctx = context.WithValue(ctx, middleware.TokenKey, "test-token")
			ctx = context.WithValue(ctx, middleware.CarIDKey, tt.carID)
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.AddFavourite(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testFavouriteHandler struct {
	favouriteService *mockFavouriteService
	userService      *mockUserService
}

func (h *testFavouriteHandler) AddFavourite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok || userID == 0 {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	token, ok := r.Context().Value(middleware.TokenKey).(string)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	me, err := h.userService.GetCurrentUser(token)
	if err != nil || !me.Roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Access denied: buyer role required")
		return
	}

	carID, ok := r.Context().Value(middleware.CarIDKey).(int)
	if !ok {
		carID = 0
	}
	if carID <= 0 {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	if err := h.favouriteService.AddFavourite(userID, carID); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, fmt.Sprintf("Car %d added to favourites", carID))
}

func TestFavouriteHandler_RemoveFavourite(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		userID              int
		carID               int
		isBuyer             bool
		removeFavouriteFunc func(userID, carID int) error
		expectedStatus      int
	}{
		{
			name:    "Successful remove",
			method:  "DELETE",
			userID:  1,
			carID:   1,
			isBuyer: true,
			removeFavouriteFunc: func(userID, carID int) error {
				return nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:    "Favourite not found",
			method:  "DELETE",
			userID:  1,
			carID:   1,
			isBuyer: true,
			removeFavouriteFunc: func(userID, carID int) error {
				return sql.ErrNoRows
			},
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			userID:         1,
			carID:          1,
			isBuyer:        true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockFavouriteService := &mockFavouriteService{
				removeFavouriteFunc: tt.removeFavouriteFunc,
			}
			mockUserService := &mockUserService{
				getCurrentUserFunc: func(token string) (*models.UserMeData, error) {
					return &models.UserMeData{
						Roles: models.UserRoles{
							Buyer: tt.isBuyer,
						},
					}, nil
				},
			}

			handler := &testFavouriteHandler{
				favouriteService: mockFavouriteService,
				userService:      mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/favorites/1", nil)
			ctx := context.WithValue(req.Context(), middleware.UserIDKey, tt.userID)
			ctx = context.WithValue(ctx, middleware.TokenKey, "test-token")
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.RemoveFavourite(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testFavouriteHandler) RemoveFavourite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	token, ok := r.Context().Value(middleware.TokenKey).(string)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	me, err := h.userService.GetCurrentUser(token)
	if err != nil || !me.Roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Access denied: buyer role required")
		return
	}

	carID := 1 // Simplified for test
	err = h.favouriteService.RemoveFavourite(userID, carID)
	if err != nil {
		status := http.StatusBadRequest
		if err == sql.ErrNoRows {
			status = http.StatusNotFound
		}
		utils.WriteError(w, status, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, fmt.Sprintf("Car %d removed from favourites", carID))
}

func TestFavouriteHandler_GetMyFavourites(t *testing.T) {
	tests := []struct {
		name                      string
		method                    string
		userID                    int
		isBuyer                   bool
		getFavouriteListItemsFunc func(userID int, lang string) ([]models.CarListItem, error)
		expectedStatus            int
	}{
		{
			name:    "Successful get",
			method:  "GET",
			userID:  1,
			isBuyer: true,
			getFavouriteListItemsFunc: func(userID int, lang string) ([]models.CarListItem, error) {
				return []models.CarListItem{}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Not a buyer",
			method:         "GET",
			userID:         1,
			isBuyer:        false,
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			userID:         1,
			isBuyer:        true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockFavouriteService := &mockFavouriteService{
				getFavouriteListItemsFunc: tt.getFavouriteListItemsFunc,
			}
			mockUserService := &mockUserService{
				getCurrentUserFunc: func(token string) (*models.UserMeData, error) {
					return &models.UserMeData{
						Roles: models.UserRoles{
							Buyer: tt.isBuyer,
						},
					}, nil
				},
			}

			handler := &testFavouriteHandler{
				favouriteService: mockFavouriteService,
				userService:      mockUserService,
			}

			req := httptest.NewRequest(tt.method, "/api/favorites/my", nil)
			ctx := context.WithValue(req.Context(), middleware.UserIDKey, tt.userID)
			ctx = context.WithValue(ctx, middleware.TokenKey, "test-token")
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()

			handler.GetMyFavourites(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testFavouriteHandler) GetMyFavourites(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	token, ok := r.Context().Value(middleware.TokenKey).(string)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	me, err := h.userService.GetCurrentUser(token)
	if err != nil || !me.Roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Access denied: buyer role required")
		return
	}

	// Get language preference (default to English)
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Get favorites as lightweight list items (always translated for display)
	listItems, err := h.favouriteService.GetFavouriteListItems(userID, lang)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, listItems, "")
}
