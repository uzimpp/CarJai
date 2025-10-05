package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// CarHandler handles car-related HTTP requests
type CarHandler struct {
	carService  *services.CarService
	userService *services.UserService
}

// NewCarHandler creates a new car handler
func NewCarHandler(carService *services.CarService, userService *services.UserService) *CarHandler {
	return &CarHandler{
		carService:  carService,
		userService: userService,
	}
}

// CreateCar handles POST /api/cars
func (h *CarHandler) CreateCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "Only sellers can create car listings",
		})
		return
	}

	// Parse request body
	var req models.CreateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Create car
	car, err := h.carService.CreateCar(userID, &req)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to create car: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusCreated, models.CarResponse{
		Success: true,
		Data:    *car,
		Message: "Car created successfully",
	})
}

// GetCar handles GET /api/cars/{id}
func (h *CarHandler) GetCar(w http.ResponseWriter, r *http.Request) {
	// Extract car ID from URL
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Get car with images
	carWithImages, err := h.carService.GetCarWithImages(carID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Car not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get car: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.CarWithImagesResponse{
		Success: true,
		Data:    *carWithImages,
	})
}

// GetMyCars handles GET /api/cars/my
func (h *CarHandler) GetMyCars(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Get user's cars
	cars, err := h.carService.GetCarsBySellerID(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get cars: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.CarListResponse{
		Success: true,
		Data:    cars,
	})
}

// SearchCars handles GET /api/cars/search (public)
func (h *CarHandler) SearchCars(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := r.URL.Query()

	// Build search request
	req := &models.SearchCarsRequest{
		Query:  query.Get("q"),
		Status: "active",
	}

	// Parse price filters
	if minPriceStr := query.Get("minPrice"); minPriceStr != "" {
		if minPrice, err := strconv.Atoi(minPriceStr); err == nil {
			req.MinPrice = &minPrice
		}
	}
	if maxPriceStr := query.Get("maxPrice"); maxPriceStr != "" {
		if maxPrice, err := strconv.Atoi(maxPriceStr); err == nil {
			req.MaxPrice = &maxPrice
		}
	}

	// Parse year filters
	if minYearStr := query.Get("minYear"); minYearStr != "" {
		if minYear, err := strconv.Atoi(minYearStr); err == nil {
			req.MinYear = &minYear
		}
	}
	if maxYearStr := query.Get("maxYear"); maxYearStr != "" {
		if maxYear, err := strconv.Atoi(maxYearStr); err == nil {
			req.MaxYear = &maxYear
		}
	}

	// Parse province
	if province := query.Get("province"); province != "" {
		req.Province = &province
	}

	// Parse type filters
	if bodyTypeStr := query.Get("bodyTypeId"); bodyTypeStr != "" {
		if bodyType, err := strconv.Atoi(bodyTypeStr); err == nil {
			req.BodyTypeID = &bodyType
		}
	}
	if fuelTypeStr := query.Get("fuelTypeId"); fuelTypeStr != "" {
		if fuelType, err := strconv.Atoi(fuelTypeStr); err == nil {
			req.FuelTypeID = &fuelType
		}
	}

	// Parse pagination
	page := 1
	if pageStr := query.Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 20
	if limitStr := query.Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	req.Limit = limit
	req.Offset = (page - 1) * limit

	// Search cars
	cars, total, err := h.carService.SearchActiveCars(req)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to search cars: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.PaginatedCarListResponse{
		Success: true,
		Data: models.PaginatedCarListData{
			Cars:  cars,
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// UpdateCar handles PUT /api/cars/{id}
func (h *CarHandler) UpdateCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Parse request body
	var req models.UpdateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Update car
	if err := h.carService.UpdateCar(carID, userID, &req, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Car not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to update car: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Car updated successfully",
	})
}

// DeleteCar handles DELETE /api/cars/{id}
func (h *CarHandler) DeleteCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Delete car
	if err := h.carService.DeleteCar(carID, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Car not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to delete car: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Car deleted successfully",
	})
}

// UploadCarImages handles POST /api/cars/{id}/images
func (h *CarHandler) UploadCarImages(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Parse multipart form (max 600MB total for 12 images * 50MB)
	err = r.ParseMultipartForm(600 << 20)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to parse multipart form",
		})
		return
	}

	// Get files from form
	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "No images provided",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Upload images
	uploadedImages, err := h.carService.UploadCarImages(carID, userID, files, isAdmin)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Car not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusCreated, models.ImageUploadResponse{
		Success: true,
		Data: models.ImageUploadData{
			CarID:         carID,
			UploadedCount: len(uploadedImages),
			Images:        uploadedImages,
		},
		Message: fmt.Sprintf("Successfully uploaded %d image(s)", len(uploadedImages)),
	})
}

// GetCarImage handles GET /api/cars/images/{id}
func (h *CarHandler) GetCarImage(w http.ResponseWriter, r *http.Request) {
	// Extract image ID
	imageID, err := extractIDFromPath(r.URL.Path, "/api/cars/images/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid image ID",
		})
		return
	}

	// Get image
	image, err := h.carService.GetCarImage(imageID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Image not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get image: %v", err),
		})
		return
	}

	// Set content type and write image data
	w.Header().Set("Content-Type", image.ImageType)
	w.Header().Set("Content-Length", strconv.Itoa(len(image.ImageData)))
	w.Header().Set("Cache-Control", "public, max-age=86400") // Cache for 1 day
	w.WriteHeader(http.StatusOK)
	w.Write(image.ImageData)
}

// DeleteCarImage handles DELETE /api/cars/images/{id}
func (h *CarHandler) DeleteCarImage(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract image ID
	imageID, err := extractIDFromPath(r.URL.Path, "/api/cars/images/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid image ID",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Delete image
	if err := h.carService.DeleteCarImage(imageID, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
				Success: false,
				Error:   "Image not found",
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to delete image: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Image deleted successfully",
	})
}

// Helper function to extract ID from URL path
func extractIDFromPath(path, prefix string) (int, error) {
	// Remove prefix
	idStr := strings.TrimPrefix(path, prefix)

	// Remove anything after the ID (like /images)
	if idx := strings.Index(idStr, "/"); idx != -1 {
		idStr = idStr[:idx]
	}

	// Parse ID
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("invalid ID format")
	}

	return id, nil
}
