package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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
		Cars:  *cars,
		Total: len(*cars),
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// HandleUpdateCar handles PATCH /admin/cars/:id
func (h *AdminCarHandler) HandleUpdateCar(w http.ResponseWriter, r *http.Request) {
	// Extract car ID from URL path
	parts := strings.Split(r.URL.Path, "/")
	idStr := parts[len(parts)-1]
	carID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	var req models.AdminUpdateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Call the service
	updatedCar, err := h.carService.UpdateCarByAdmin(carID, req)
	if err != nil {
		if strings.Contains(err.Error(), "car not found") {
			utils.WriteError(w, http.StatusNotFound, err.Error())
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	// Return the updated car's public data
	utils.WriteJSON(w, http.StatusOK, updatedCar, "")
}

// HandleCreateCar handles POST /admin/cars
func (h *AdminCarHandler) HandleCreateCar(w http.ResponseWriter, r *http.Request) {
	var req models.AdminCreateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	newCar, err := h.carService.CreateCarByAdmin(req)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.WriteJSON(w, http.StatusCreated, newCar, "")
}

// HandleDeleteCar handles DELETE /admin/cars/:id
func (h *AdminCarHandler) HandleDeleteCar(w http.ResponseWriter, r *http.Request) {
	// Extract car ID from URL path
	parts := strings.Split(r.URL.Path, "/")
	idStr := parts[len(parts)-1]
	carID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Call the service
	err = h.carService.DeleteCarByAdmin(carID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, err.Error())
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Car deleted successfully")
}
