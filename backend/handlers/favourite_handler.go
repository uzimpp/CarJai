package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// FavouriteHandler handles favourites endpoints
type FavouriteHandler struct {
	favouriteService *services.FavouriteService
	userService      *services.UserService
}

func NewFavouriteHandler(favService *services.FavouriteService, userService *services.UserService) *FavouriteHandler {
	return &FavouriteHandler{favouriteService: favService, userService: userService}
}

// AddFavourite handles POST /api/favorites/{carId}
func (h *FavouriteHandler) AddFavourite(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Enforce buyer-only access directly
	token, ok := middleware.GetTokenFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	me, err := h.userService.GetCurrentUser(token)
	if err != nil || !me.Roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Access denied: buyer role required")
		return
	}

	// Extract car ID from URL path
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/favorites/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	if err := h.favouriteService.AddFavourite(userID, carID); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, fmt.Sprintf("Car %d added to favourites", carID))
}

// RemoveFavourite handles DELETE /api/favorites/{carId}
func (h *FavouriteHandler) RemoveFavourite(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Enforce buyer-only access directly
	token, ok := middleware.GetTokenFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	me, err := h.userService.GetCurrentUser(token)
	if err != nil || !me.Roles.Buyer {
		utils.WriteError(w, http.StatusForbidden, "Access denied: buyer role required")
		return
	}

	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/favorites/")
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

	utils.WriteJSON(w, http.StatusOK, nil, fmt.Sprintf("Car %d removed from favourites", carID))
}

// GetMyFavourites handles GET /api/favorites/my
func (h *FavouriteHandler) GetMyFavourites(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Enforce buyer-only access directly
	token, ok := middleware.GetTokenFromContext(r)
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
