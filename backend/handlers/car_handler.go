package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// CarHandler handles car-related HTTP requests
type CarHandler struct {
	carService     *services.CarService
	userService    *services.UserService
	ocrService     *services.OCRService
	scraperService *services.ScraperService
}

// NewCarHandler creates a new car handler
func NewCarHandler(carService *services.CarService, userService *services.UserService, ocrService *services.OCRService, scraperService *services.ScraperService) *CarHandler {
	return &CarHandler{
		carService:     carService,
		userService:    userService,
		ocrService:     ocrService,
		scraperService: scraperService,
	}
}

// CreateCar handles POST /api/cars
func (h *CarHandler) CreateCar(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

	// Create empty draft car (no request body needed)
	car, err := h.carService.CreateCar(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to create car: %v", err),
		})
		return
	}

	// Return minimal response with just the car ID
	utils.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Draft created successfully",
		"data": map[string]interface{}{
			"id": car.ID,
		},
	})
}

// GetCar handles GET /api/cars/{id}
func (h *CarHandler) GetCar(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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
	// Check method
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Get user's cars with images
	listings, err := h.carService.GetCarsBySellerIDWithImages(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get cars: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.CarListingWithImagesResponse{
		Success: true,
		Data:    listings,
	})
}

// SearchCars handles GET /api/cars/search (public)
func (h *CarHandler) SearchCars(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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
	if provinceStr := query.Get("provinceId"); provinceStr != "" {
		if provinceID, err := strconv.Atoi(provinceStr); err == nil {
			req.ProvinceID = &provinceID
		}
	}

	// Parse type filters
	if bodyTypeCode := query.Get("bodyTypeCode"); bodyTypeCode != "" {
		req.BodyTypeCode = &bodyTypeCode
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

	// Search cars with images and details
	listings, total, err := h.carService.SearchActiveCarsWithImages(req)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to search cars: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, models.PaginatedCarListingResponse{
		Success: true,
		Data: models.PaginatedCarListingData{
			Cars:  listings,
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

// AutoSaveDraft handles PATCH /api/cars/{id}/draft - Auto-save without strict validation
func (h *CarHandler) AutoSaveDraft(w http.ResponseWriter, r *http.Request) {
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

	// Parse request body
	var req models.UpdateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Auto-save draft (relaxed validation)
	if err := h.carService.AutoSaveDraft(carID, userID, &req); err != nil {
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

	// Compute and return step-wise readiness to guide UI
	step2Ready, step2Issues := h.carService.ComputeStep2Status(carID)
	step3Ready, step3Issues := h.carService.ComputeStep3Status(carID)

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Draft saved successfully",
		"stepStatus": models.StepStatus{
			Step2: models.StepState{Ready: step2Ready, Issues: step2Issues},
			Step3: models.StepState{Ready: step3Ready, Issues: step3Issues},
		},
	})
}

// HandleCarCRUD handles PUT/PATCH/DELETE /api/cars/{id} (authenticated)
func (h *CarHandler) HandleCarCRUD(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		h.UpdateCar(w, r)
	case http.MethodPatch:
		h.AutoSaveDraft(w, r)
	case http.MethodDelete:
		h.DeleteCar(w, r)
	default:
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
	}
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

// DiscardCar handles POST /api/cars/{id}/discard (alias for deleting a draft; owner-only)
func (h *CarHandler) DiscardCar(w http.ResponseWriter, r *http.Request) {
	// Enforce POST
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

	// Delete via service (owner-only, drafts)
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
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Draft discarded",
	})
}

// UploadCarImages handles POST /api/cars/{id}/images
func (h *CarHandler) UploadCarImages(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

// HandleImageByID handles /api/cars/images/{id} - GET public, DELETE authenticated
func (h *CarHandler) HandleImageByID(w http.ResponseWriter, r *http.Request, authMiddleware *middleware.UserAuthMiddleware) {
	switch r.Method {
	case http.MethodGet:
		// Public: Get image data
		h.GetCarImage(w, r)
	case http.MethodDelete:
		// Authenticated: Delete image
		authMiddleware.RequireAuth(h.DeleteCarImage)(w, r)
	default:
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
	}
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

// ReorderImages handles PUT /api/cars/{id}/images/order
func (h *CarHandler) ReorderImages(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPut {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

	// Parse request body
	var req models.ReorderImagesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Reorder images
	if err := h.carService.ReorderImagesBulk(carID, req.ImageIDs, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Images reordered successfully",
	})
}

// Review handles GET /api/cars/{id}/review
func (h *CarHandler) Review(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodGet {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

	// Verify ownership
	car, err := h.carService.GetCarByID(carID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Car not found",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	if !isAdmin && car.SellerID != userID {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "You can only review your own cars",
		})
		return
	}

	// Run publish validation
	ready, issues := h.carService.ValidatePublish(carID)

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data": models.ReviewResponse{
			Ready:  ready,
			Issues: issues,
		},
	})
}

// UpdateStatus handles PUT /api/cars/{id}/status
func (h *CarHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPut {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

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

	// Parse request body
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value("admin_id").(int); ok && adminID > 0 {
		isAdmin = true
	}

	// If changing to active, validate publish readiness
	if req.Status == "active" {
		ready, issues := h.carService.ValidatePublish(carID)
		if !ready {
			utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Cannot publish car: %v", issues),
			})
			return
		}
	}

	// Update status via UpdateCar
	updateReq := models.UpdateCarRequest{
		Status: &req.Status,
	}

	if err := h.carService.UpdateCar(carID, userID, &updateReq, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Status updated successfully",
	})
}

// UploadBook handles POST /api/cars/book - Upload vehicle registration book and create draft car
func (h *CarHandler) UploadBook(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Get user from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID from path: /api/cars/{id}/book
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "Only sellers can upload vehicle registration books",
		})
		return
	}

	// Parse multipart form (10 MB max)
	const maxUploadSize = int64(10 * 1024 * 1024)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "File is too large (max 10MB)",
		})
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("file")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid 'file' field in form",
		})
		return
	}
	defer file.Close()

	// Extract raw OCR fields once, then map to structured fields
	rawFields, err := h.ocrService.OCRFromFile(file, handler)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to extract data from document: %v", err),
		})
		return
	}

	bookFields, err := h.ocrService.MapToBookFields(rawFields)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to extract data from document: %v", err),
		})
		return
	}

	// Upload book with duplicate resolution
	_, action, redirectToCarID, errorCode, err := h.carService.UploadBookToDraft(carID, userID, bookFields)
	if err != nil {
		if errorCode != "" {
			// Return error with code for client handling
			utils.RespondJSON(w, http.StatusConflict, map[string]interface{}{
				"success":         false,
				"message":         err.Error(),
				"code":            errorCode,
				"action":          action,
				"redirectToCarID": redirectToCarID,
			})
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to upload book: %v", err),
		})
		return
	}

	// Return display-ready OCR fields without DB writes
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Vehicle registration book processed successfully",
		"data":    bookFields.ToMap(),
	})
}

// UploadInspection handles POST /api/cars/{id}/inspection - Upload vehicle inspection document
func (h *CarHandler) UploadInspection(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Get user from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID from path
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "Only sellers can upload vehicle inspections",
		})
		return
	}

	// Check content type to determine if it's file upload or URL
	contentType := r.Header.Get("Content-Type")
	var inspectionData map[string]string

	if strings.HasPrefix(contentType, "multipart/form-data") {
		// File upload - not implemented yet, return error
		utils.RespondJSON(w, http.StatusNotImplemented, models.UserErrorResponse{
			Success: false,
			Error:   "File upload for inspection not yet implemented. Please use URL scraping instead.",
		})
		return
	} else if strings.HasPrefix(contentType, "application/json") {
		// URL scraping
		var req struct {
			URL string `json:"url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
				Success: false,
				Error:   "Invalid request body",
			})
			return
		}

		if req.URL == "" {
			utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
				Success: false,
				Error:   "URL is required",
			})
			return
		}

		// Scrape inspection data
		inspectionData, err = h.scraperService.ScrapeInspectionData(req.URL)
		if err != nil {
			utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to scrape inspection data: %v", err),
			})
			return
		}
	} else {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid content type. Use multipart/form-data for file upload or application/json for URL",
		})
		return
	}

	// Map scraped fields to structured inspection fields (no DB writes)
	inspectionFields, err := h.scraperService.MapToInspectionFields(inspectionData)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Upload inspection with duplicate resolution
	_, redirectToCarID, errorCode, err := h.carService.UploadInspectionToDraft(carID, userID, inspectionFields, h.scraperService)
	if err != nil {
		if errorCode != "" {
			// Return error with code for client handling
			resp := map[string]interface{}{
				"success": false,
				"message": err.Error(),
				"code":    errorCode,
			}
			// For duplicate-own-draft, include existingCarId only (no action/redirect in conflict flow)
			if errorCode == services.ErrCodeCarDuplicateOwnDraft && redirectToCarID != nil {
				resp["redirectToCarID"] = *redirectToCarID
			}
			utils.RespondJSON(w, http.StatusConflict, resp)
			return
		}
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to upload inspection: %v", err),
		})
		return
	}

	// Build display payload and enrich with color labels from DB
	payload := inspectionFields.ToMap()
	if codesAny, ok := payload["colors"]; ok {
		if codes, ok := codesAny.([]string); ok && len(codes) > 0 {
			// Resolve labels via service
			labels, _ := h.carService.GetColorLabelsByCodes(codes, "en")
			payload["colors"] = labels
		}
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Vehicle inspection processed successfully",
		"data":    payload,
	})
}

// RestoreProgress handles POST /api/cars/{id}/restore-progress
func (h *CarHandler) RestoreProgress(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Extract car ID from URL
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Parse request body
	var req struct {
		SourceCarID int `json:"sourceCarId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Validate source car ID
	if req.SourceCarID <= 0 {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Source car ID is required",
		})
		return
	}

	// Check ownership of both cars
	targetCar, err := h.carService.GetCarByID(carID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Target car not found",
		})
		return
	}

	if targetCar.SellerID != userID {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "You can only restore progress to your own cars",
		})
		return
	}

	sourceCar, err := h.carService.GetCarByID(req.SourceCarID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Source car not found",
		})
		return
	}

	if sourceCar.SellerID != userID {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "You can only restore progress from your own cars",
		})
		return
	}

	// Check that target car is a draft
	if targetCar.Status != "draft" {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Can only restore progress to draft cars",
		})
		return
	}

	// Check that source car is a draft
	if sourceCar.Status != "draft" {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Can only restore progress from draft cars",
		})
		return
	}

	// Restore progress from source to target
	if err := h.carService.RestoreProgressFromCar(req.SourceCarID, carID); err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to restore progress: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Progress restored successfully",
	})
}

// RedirectToDraft handles POST /api/cars/{id}/redirect-to-draft
func (h *CarHandler) RedirectToDraft(w http.ResponseWriter, r *http.Request) {
	// Check method
	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, models.UserErrorResponse{
			Success: false,
			Error:   "Method not allowed",
		})
		return
	}

	// Get user from context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.RespondJSON(w, http.StatusUnauthorized, models.UserErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Parse request body
	var req struct {
		TargetCarID int `json:"targetCarId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid request body",
		})
		return
	}

	// Extract car ID from URL
	carID, err := extractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Invalid car ID",
		})
		return
	}

	// Validate target car ID
	if req.TargetCarID <= 0 {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Target car ID is required",
		})
		return
	}

	// Check ownership of both cars
	currentCar, err := h.carService.GetCarByID(carID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Current car not found",
		})
		return
	}

	if currentCar.SellerID != userID {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "You can only redirect your own cars",
		})
		return
	}

	targetCar, err := h.carService.GetCarByID(req.TargetCarID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, models.UserErrorResponse{
			Success: false,
			Error:   "Target car not found",
		})
		return
	}

	if targetCar.SellerID != userID {
		utils.RespondJSON(w, http.StatusForbidden, models.UserErrorResponse{
			Success: false,
			Error:   "You can only redirect to your own cars",
		})
		return
	}

	// Check that both cars are drafts
	if currentCar.Status != "draft" {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Can only redirect from draft cars",
		})
		return
	}

	if targetCar.Status != "draft" {
		utils.RespondJSON(w, http.StatusBadRequest, models.UserErrorResponse{
			Success: false,
			Error:   "Can only redirect to draft cars",
		})
		return
	}

	// Transfer progress from current car to target car
	if err := h.carService.RestoreProgressFromCar(carID, req.TargetCarID); err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to transfer progress: %v", err),
		})
		return
	}

	// Delete the current car (even if it has progress, user chose to redirect)
	if err := h.carService.DeleteCar(carID, userID, false); err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to delete current car: %v", err),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success":         true,
		"message":         "Redirected to existing draft successfully",
		"redirectToCarId": req.TargetCarID,
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
