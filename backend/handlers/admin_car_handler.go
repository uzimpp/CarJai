package handlers

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminCarHandler handles admin operations on cars
type AdminCarHandler struct {
	carService *services.CarService
}

// NewAdminCarHandler creates a new handler for admin-car operations
func NewAdminCarHandler(carService *services.CarService) *AdminCarHandler {
	return &AdminCarHandler{
		carService: carService,
	}
}

// HandleGetCars handles GET /admin/cars
func (h *AdminCarHandler) HandleGetCars(w http.ResponseWriter, r *http.Request) {
	cars, err := h.carService.GetManagedCars()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve cars")
		return
	}

	response := models.AdminCarsListResponse{
		Success: true,
		Data:    *cars,
		Total:   len(*cars),
	}

	utils.WriteJSON(w, http.StatusOK, response)
}