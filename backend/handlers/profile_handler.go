package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ProfileHandler handles profile-related requests
type ProfileHandler struct {
	profileService *services.ProfileService
	userService    *services.UserService
	carService     *services.CarService
}

// NewProfileHandler creates a new profile handler
func NewProfileHandler(profileService *services.ProfileService, userService *services.UserService, carService *services.CarService) *ProfileHandler {
	return &ProfileHandler{
		profileService: profileService,
		userService:    userService,
		carService:     carService,
	}
}

// Profile returns the full profile aggregate for the authenticated user
func (h *ProfileHandler) Profile(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user from context (set by auth middleware)
	user, ok := middleware.GetUserFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get full profile
	profileData, err := h.profileService.GetFullProfile(user.ID, user)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	utils.WriteJSON(w, http.StatusOK, *profileData, "")
}

// UpdateSelf updates the authenticated user's profile (account fields, buyer, and/or seller profiles)
func (h *ProfileHandler) UpdateSelf(w http.ResponseWriter, r *http.Request) {
	// Get authenticated user from context (set by auth middleware)
	user, ok := middleware.GetUserFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse request body
	var req models.UserUpdateSelfRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Track what was updated for response message
	updatedFields := []string{}

	// Update account fields (username, name) if provided
	if req.Username != nil || req.Name != nil {
		// Check if username is taken (if provided and different from current)
		if req.Username != nil && *req.Username != user.Username {
			existingUser, err := h.userService.GetUserByUsername(*req.Username)
			if err == nil && existingUser != nil {
				utils.WriteError(w, http.StatusBadRequest, "Username already taken")
				return
			}
		}

		// Update user
		updatedUser, err := h.userService.UpdateUser(user.ID, req.Username, req.Name)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to update account")
			return
		}
		user = updatedUser
		if req.Username != nil {
			updatedFields = append(updatedFields, "username")
		}
		if req.Name != nil {
			updatedFields = append(updatedFields, "name")
		}
	}

	// Update buyer profile if provided
	if req.Buyer != nil {
		_, err := h.profileService.UpsertBuyer(user.ID, *req.Buyer)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Failed to update buyer profile: %v", err))
			return
		}
		updatedFields = append(updatedFields, "buyer profile")
	}

	// Update seller profile if provided
	if req.Seller != nil {
		_, _, err := h.profileService.UpsertSeller(user.ID, *req.Seller)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Failed to update seller profile: %v", err))
			return
		}
		updatedFields = append(updatedFields, "seller profile")
	}

	// If nothing was provided to update, return error
	if len(updatedFields) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "No fields provided to update")
		return
	}

	// Get full updated profile to return
	profileData, err := h.profileService.GetFullProfile(user.ID, user)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get updated profile")
		return
	}

	utils.WriteJSON(w, http.StatusOK, *profileData, "")
}

// GetSellerProfile returns the seller profile for displaying (public endpoint, takes seller ID from URL)
func (h *ProfileHandler) GetSellerProfile(w http.ResponseWriter, r *http.Request) {
	// Extract seller ID from URL path (seller ID is the same as user ID in sellers table)
	sellerID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/profile/seller/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid seller ID")
		return
	}

	// Get seller profile by seller ID (which is the user ID)
	seller, err := h.profileService.GetSellerByUserID(sellerID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller profile not found")
		return
	}

	// Get seller contacts
	contacts, err := h.profileService.GetSellerContacts(sellerID)
	if err != nil {
		// Return seller without contacts if contacts fetch fails
		contacts = []models.SellerContact{}
	}

	// Get seller's cars (lightweight list items only)
	// Get language preference (default to English)
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}
	cars, err := h.carService.GetCarListItemsBySellerID(sellerID, lang)
	if err != nil {
		// Return seller without cars if cars fetch fails
		cars = []models.CarListItem{}
	}

	response := models.SellerData{
		Seller:   *seller,
		Contacts: contacts,
		Cars:     cars,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}
