package handlers

import (
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// PublicSellerHandler handles public seller-related requests (no auth required)
type PublicSellerHandler struct {
	profileService *services.ProfileService
	carService     *services.CarService
}

// NewPublicSellerHandler creates a new public seller handler
func NewPublicSellerHandler(profileService *services.ProfileService, carService *services.CarService) *PublicSellerHandler {
	return &PublicSellerHandler{
		profileService: profileService,
		carService:     carService,
	}
}

// GetSeller returns a public seller profile by ID or handle
func (h *PublicSellerHandler) GetSeller(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract seller ID from path: /api/sellers/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/sellers/")
	sellerID := strings.Split(path, "/")[0]

	if sellerID == "" {
		utils.WriteError(w, http.StatusBadRequest, "Seller ID is required")
		return
	}

	// Get seller profile
	seller, err := h.profileService.GetPublicSellerByID(sellerID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller not found")
		return
	}

	response := models.SellerResponse{
		Success: true,
		Data: models.SellerData{
			Seller:   *seller,
			Contacts: []models.SellerContact{}, // Don't include contacts in basic profile view
		},
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// GetSellerContacts returns all contacts for a public seller
func (h *PublicSellerHandler) GetSellerContacts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract seller ID from path: /api/sellers/{id}/contacts
	path := strings.TrimPrefix(r.URL.Path, "/api/sellers/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		utils.WriteError(w, http.StatusBadRequest, "Seller ID is required")
		return
	}
	sellerID := parts[0]

	// Verify seller exists
	seller, err := h.profileService.GetPublicSellerByID(sellerID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller not found")
		return
	}

	// Get seller contacts
	contacts, err := h.profileService.GetSellerContacts(seller.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get seller contacts")
		return
	}

	response := map[string]interface{}{
		"success":  true,
		"contacts": contacts,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// GetSellerCars returns all active cars for a public seller
func (h *PublicSellerHandler) GetSellerCars(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract seller ID from path: /api/sellers/{id}/cars
	path := strings.TrimPrefix(r.URL.Path, "/api/sellers/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		utils.WriteError(w, http.StatusBadRequest, "Seller ID is required")
		return
	}
	sellerID := parts[0]

	// Verify seller exists and get the seller object
	seller, err := h.profileService.GetPublicSellerByID(sellerID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Seller not found")
		return
	}

	// Get all cars for this seller with images
	cars, err := h.carService.GetCarsBySellerIDWithImages(seller.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to get seller cars")
		return
	}

	// Filter to only active/published cars for public view
	activeCars := []models.CarListingWithImages{}
	for _, car := range cars {
		if car.Status == "active" {
			activeCars = append(activeCars, car)
		}
	}

	response := map[string]interface{}{
		"success": true,
		"cars":    activeCars,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}
