package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ProfileHandler handles profile-related requests
type ProfileHandler struct {
	profileService *services.ProfileService
	userService    *services.UserService
}

// NewProfileHandler creates a new profile handler
func NewProfileHandler(profileService *services.ProfileService, userService *services.UserService) *ProfileHandler {
	return &ProfileHandler{
		profileService: profileService,
		userService:    userService,
	}
}

// Profile returns the full profile aggregate for the authenticated user
func (h *ProfileHandler) Profile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Get full profile
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

// UpdateSelf updates the authenticated user's account fields (username, name)
func (h *ProfileHandler) UpdateSelf(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Parse request body
	var req models.UserUpdateSelfRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

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

	response := models.UserAuthResponse{
		Success: true,
		Data: models.UserAuthData{
			User:      updatedUser.ToPublic(),
			Token:     cookie.Value,
			ExpiresAt: user.CreatedAt, // placeholder; session doesn't change
		},
		Message: "Account updated successfully",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// GetBuyerProfile returns the buyer profile for the authenticated user
func (h *ProfileHandler) GetBuyerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Get buyer profile
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

// UpsertBuyerProfile creates or updates the buyer profile for the authenticated user
func (h *ProfileHandler) UpsertBuyerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Parse request body
	var req models.BuyerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Upsert buyer profile
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

// GetSellerProfile returns the seller profile for the authenticated user
func (h *ProfileHandler) GetSellerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Get seller profile
	seller, err := h.profileService.GetSellerByUserID(user.ID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller profile not found")
		return
	}

	// Get seller contacts
	contacts, err := h.profileService.GetSellerContacts(user.ID)
	if err != nil {
		// Return seller without contacts if contacts fetch fails
		contacts = []models.SellerContact{}
	}

	response := models.SellerResponse{
		Success: true,
		Data: models.SellerData{
			Seller:   *seller,
			Contacts: contacts,
		},
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// UpsertSellerProfile creates or updates the seller profile for the authenticated user
func (h *ProfileHandler) UpsertSellerProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get authenticated user from cookie
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

	// Parse request body
	var req models.SellerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Upsert seller profile
	seller, contacts, err := h.profileService.UpsertSeller(user.ID, req)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	contactsList := []models.SellerContact{}
	if contacts != nil {
		contactsList = *contacts
	}

	response := models.SellerResponse{
		Success: true,
		Data: models.SellerData{
			Seller:   *seller,
			Contacts: contactsList,
		},
		Message: "Seller profile updated successfully",
	}

	utils.WriteJSON(w, http.StatusOK, response)
}
