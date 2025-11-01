package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// FavouriteHandler handles favourites endpoints
type FavouriteHandler struct {
	favouriteService *services.FavouriteService
}

func NewFavouriteHandler(favService *services.FavouriteService) *FavouriteHandler {
	return &FavouriteHandler{favouriteService: favService}
}

// AddFavourite handles POST /api/favorites/{carId}
func (h *FavouriteHandler) AddFavourite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Extract car ID from URL path
	carID, err := extractIDFromPath(r.URL.Path, "/api/favorites/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	if err := h.favouriteService.AddFavourite(userID, carID); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": fmt.Sprintf("Car %d added to favourites", carID),
	})
}

// RemoveFavourite handles DELETE /api/favorites/{carId}
func (h *FavouriteHandler) RemoveFavourite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	carID, err := extractIDFromPath(r.URL.Path, "/api/favorites/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	if err := h.favouriteService.RemoveFavourite(userID, carID); err != nil {
		status := http.StatusBadRequest
		if err == sql.ErrNoRows {
			status = http.StatusNotFound
		}
		utils.WriteError(w, status, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": fmt.Sprintf("Car %d removed from favourites", carID),
	})
}

// GetMyFavourites handles GET /api/favorites/my
func (h *FavouriteHandler) GetMyFavourites(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	listings, err := h.favouriteService.GetFavouriteListings(userID)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp := models.CarListingWithImagesResponse{
		Success: true,
		Data:    listings,
	}
	utils.WriteJSON(w, http.StatusOK, resp)
}