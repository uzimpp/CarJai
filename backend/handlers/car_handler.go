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
	profileService *services.ProfileService
	ocrService     *services.OCRService
	scraperService *services.ScraperService
}

// NewCarHandler creates a new car handler
func NewCarHandler(carService *services.CarService, userService *services.UserService, profileService *services.ProfileService, ocrService *services.OCRService, scraperService *services.ScraperService) *CarHandler {
	return &CarHandler{
		carService:     carService,
		userService:    userService,
		profileService: profileService,
		ocrService:     ocrService,
		scraperService: scraperService,
	}
}

// GetPriceEstimate handles GET /api/cars/{id}/estimate
func (h *CarHandler) GetPriceEstimate(w http.ResponseWriter, r *http.Request) {
	// Get user from context (ensure user is logged in)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can view price estimates")
		return
	}

	// Extract car ID from URL
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Get price estimation from service
	price, err := h.carService.EstimateCarPrice(carID)
	if err != nil {
		// Don't return 500, just indicate estimation is unavailable
		utils.WriteError(w, http.StatusOK, err.Error()) // e.g., "estimation unavailable"
		return
	}

	// Return estimated price
	response := models.EstimatedPriceResponse{
		EstimatedPrice: price,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// CreateCar handles POST /api/cars
func (h *CarHandler) CreateCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can create car listings")
		return
	}

	// Create empty draft car (no request body needed)
	car, err := h.carService.CreateCar(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to create car: %v", err))
		return
	}

	// Return minimal response with just the car ID
	response := models.CarIDResponse{
		ID: car.ID,
	}
	utils.WriteJSON(w, http.StatusCreated, response, "")
}

// GetCar handles GET /api/cars/{id}
func (h *CarHandler) GetCar(w http.ResponseWriter, r *http.Request) {
	// Extract car ID from URL
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Get car with images
	carWithImages, err := h.carService.GetCarWithImages(carID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get car: %v", err))
		return
	}

	// Check if user is authenticated and is the owner
	// var isOwner bool
	// if userID, ok := r.Context().Value("userID").(int); ok {
	// 	isOwner = (carWithImages.Car.SellerID == userID)
	// }

	// Only allow access to active cars for public users
	// Owners can access their cars regardless of status (draft, sold, deleted)
	if carWithImages.Car.Status != "active" {
		utils.WriteError(w, http.StatusNotFound, "Car not found")
		return
	}

	// Enrich with labels and flatten into car payload
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Translate car to display-ready format (includes InspectionDisplay conversion)
	display, err := h.carService.TranslateCarForDisplay(&carWithImages.Car, lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to translate car data: %v", err))
		return
	}

	// Enrich images with URLs for display
	enrichedImages := make([]models.CarImageMetadata, len(carWithImages.Images))
	for i, img := range carWithImages.Images {
		enrichedImages[i] = img
		enrichedImages[i].URL = fmt.Sprintf("/api/cars/images/%d", img.ID)
	}

	// Get seller contacts
	var sellerContacts []models.SellerContact
	if contacts, err := h.profileService.GetSellerContacts(carWithImages.Car.SellerID); err == nil {
		sellerContacts = contacts
	}

	// Return response with proper types
	response := models.CarDetailResponse{
		Car:            display.CarDisplay,
		Images:         enrichedImages,
		Inspection:     display.InspectionDisplay,
		SellerContacts: sellerContacts,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// GetMyCars handles GET /api/cars/my
func (h *CarHandler) GetMyCars(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can view their car listings")
		return
	}

	// Get language preference (default to English)
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Get user's cars as lightweight list items (always translated for display)
	listItems, err := h.carService.GetCarListItemsBySellerID(userID, lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get cars: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, listItems, "")
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
	if provinceStr := query.Get("provinceId"); provinceStr != "" {
		if provinceID, err := strconv.Atoi(provinceStr); err == nil {
			req.ProvinceID = &provinceID
		}
	}

	// Parse type filters
	if bodyTypeCode := query.Get("bodyType"); bodyTypeCode != "" {
		req.BodyTypeCode = &bodyTypeCode
	}

	if transmissionCode := query.Get("transmission"); transmissionCode != "" {
		req.TransmissionCode = &transmissionCode
	}

	if drivetrainCode := query.Get("drivetrain"); drivetrainCode != "" {
		req.DrivetrainCode = &drivetrainCode
	}

	// Parse fuel types (multiple values)
	if fuelTypes := query["fuelTypes"]; len(fuelTypes) > 0 {
		req.FuelTypeCodes = fuelTypes
	}

	// Parse colors (multiple values)
	if colors := query["colors"]; len(colors) > 0 {
		req.ColorCodes = colors
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

	// Get language preference (default to English)
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Search cars as lightweight list items (optimized for browse/search)
	listItems, total, err := h.carService.SearchActiveCarsAsListItems(req, lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to search cars: %v", err))
		return
	}

	response := models.PaginatedCarListingData{
		Cars:  listItems,
		Total: total,
		Page:  page,
		Limit: limit,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// UpdateCar handles PUT /api/cars/{id}
func (h *CarHandler) UpdateCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can update car listings")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Parse request body
	var req models.UpdateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Update car
	if err := h.carService.UpdateCar(carID, userID, &req, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to update car: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Car updated successfully")
}

// AutoSaveDraft handles PATCH /api/cars/{id}/draft - Auto-save without strict validation
func (h *CarHandler) AutoSaveDraft(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can save drafts")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Parse request body
	var req models.UpdateCarRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Auto-save draft (relaxed validation)
	if err := h.carService.AutoSaveDraft(carID, userID, &req); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Compute and return step-wise readiness to guide UI
	step2Ready, step2Issues := h.carService.ComputeStep2Status(carID)
	step3Ready, step3Issues := h.carService.ComputeStep3Status(carID)

	utils.WriteJSON(w, http.StatusOK, models.StepStatus{
		Step2: models.StepState{Ready: step2Ready, Issues: step2Issues},
		Step3: models.StepState{Ready: step3Ready, Issues: step3Issues},
	}, "Draft saved successfully")
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
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// DeleteCar handles DELETE /api/cars/{id}
func (h *CarHandler) DeleteCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can delete car listings")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Delete car
	if err := h.carService.DeleteCar(carID, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete car: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Car deleted successfully")
}

// DiscardCar handles POST /api/cars/{id}/discard (alias for deleting a draft; owner-only)
func (h *CarHandler) DiscardCar(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can discard drafts")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Delete via service (owner-only, drafts)
	if err := h.carService.DeleteCar(carID, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Draft discarded")
}

// UploadCarImages handles POST /api/cars/{id}/images
func (h *CarHandler) UploadCarImages(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can upload car images")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Parse multipart form (max 600MB total for 12 images * 50MB)
	err = r.ParseMultipartForm(600 << 20)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Failed to parse multipart form")
		return
	}

	// Get files from form
	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "No images provided")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Upload images
	uploadedImages, err := h.carService.UploadCarImages(carID, userID, files, isAdmin)
	if err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Car not found")
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	response := models.ImageUploadData{
		CarID:         carID,
		UploadedCount: len(uploadedImages),
		Images:        uploadedImages,
	}
	utils.WriteJSON(w, http.StatusCreated, response, "")
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
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// GetCarImage handles GET /api/cars/images/{id}
func (h *CarHandler) GetCarImage(w http.ResponseWriter, r *http.Request) {
	// Extract image ID
	imageID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/images/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid image ID")
		return
	}

	// Get image
	image, err := h.carService.GetCarImage(imageID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Image not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError,
			fmt.Sprintf("Failed to get image: %v", err),
		)
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
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can delete car images")
		return
	}

	// Extract image ID
	imageID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/images/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid image ID")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Delete image
	if err := h.carService.DeleteCarImage(imageID, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not found") {
			utils.WriteError(w, http.StatusNotFound, "Image not found")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to delete image: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Image deleted successfully")
}

// ReorderImages handles PUT /api/cars/{id}/images/order
func (h *CarHandler) ReorderImages(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can reorder car images")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Parse request body
	var req models.ReorderImagesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// Reorder images
	if err := h.carService.ReorderImagesBulk(carID, req.ImageIDs, userID, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Images reordered successfully")
}

// Review handles GET /api/cars/{id}/review
func (h *CarHandler) Review(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can review car listings")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Verify ownership
	car, err := h.carService.GetCarByID(carID)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Car not found")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	if !isAdmin && car.SellerID != userID {
		utils.WriteError(w, http.StatusForbidden, "You can only review your own cars")
		return
	}

	// Run publish validation
	ready, issues := h.carService.ValidatePublish(carID)

	response := models.ReviewResponse{
		Ready:  ready,
		Issues: issues,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

// UpdateStatus handles PUT /api/cars/{id}/status
func (h *CarHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can update car status")
		return
	}

	// Extract car ID
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Parse request body
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user is admin
	isAdmin := false
	if adminID, ok := r.Context().Value(middleware.AdminIDKey).(int); ok && adminID > 0 {
		isAdmin = true
	}

	// If changing to active, validate publish readiness
	if req.Status == "active" {
		ready, issues := h.carService.ValidatePublish(carID)
		if !ready {
			utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Cannot publish car: %v", issues))
			return
		}
	}

	// Update status via UpdateCar
	updateReq := models.UpdateCarRequest{
		Status: &req.Status,
	}

	if err := h.carService.UpdateCar(carID, userID, &updateReq, isAdmin); err != nil {
		if strings.Contains(err.Error(), "unauthorized") {
			utils.WriteError(w, http.StatusForbidden, err.Error())
			return
		}
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Status updated successfully")
}

// UploadBook handles POST /api/cars/{id}/book - Upload vehicle registration book to existing car
func (h *CarHandler) UploadBook(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Extract car ID from path: /api/cars/{id}/book
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can upload vehicle registration books")
		return
	}

	// Parse multipart form (10 MB max)
	const maxUploadSize = int64(10 * 1024 * 1024)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "File is too large (max 10MB)")
		return
	}

	// Get file from form
	file, handler, err := r.FormFile("file")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid 'file' field in form")
		return
	}
	defer file.Close()

	// Extract raw OCR fields once, then map to structured fields
	rawFields, err := h.ocrService.OCRFromFile(file, handler)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Failed to extract data from document: %v", err))
		return
	}

	bookFields, err := h.ocrService.MapToBookFields(rawFields)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Failed to extract data from document: %v", err))
		return
	}

	// Upload book with duplicate resolution
	_, action, redirectToCarID, errorCode, err := h.carService.UploadBookToDraft(carID, userID, bookFields)
	if err != nil {
		if errorCode != "" {
			// Return error with code for client handling
			response := models.BookUploadErrorResponse{
				Message:         err.Error(),
				Code:            errorCode,
				Action:          action,
				RedirectToCarID: redirectToCarID,
			}
			utils.WriteJSON(w, http.StatusConflict, response, "")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload book: %v", err))
		return
	}

	// Return display-ready OCR fields without DB query
	utils.WriteJSON(w, http.StatusOK, bookFields.ToMap(), "Vehicle registration book processed successfully")
}

// UploadInspection handles POST /api/cars/{id}/inspection - Upload vehicle inspection document
func (h *CarHandler) UploadInspection(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Extract car ID from path
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can upload vehicle inspections")
		return
	}

	// Check content type to determine if it's file upload or URL
	contentType := r.Header.Get("Content-Type")
	var inspectionData map[string]string

	if strings.HasPrefix(contentType, "multipart/form-data") {
		// File upload - not implemented yet, return error
		utils.WriteError(w, http.StatusNotImplemented, "File upload for inspection not yet implemented. Please use URL scraping instead.")
		return
	} else if strings.HasPrefix(contentType, "application/json") {
		// URL scraping
		var req struct {
			URL string `json:"url"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.URL == "" {
			utils.WriteError(w, http.StatusBadRequest, "URL is required")
			return
		}

		// Scrape inspection data
		inspectionData, err = h.scraperService.ScrapeInspectionData(req.URL)
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Failed to scrape inspection data: %v", err))
			return
		}
	} else {
		utils.WriteError(w, http.StatusBadRequest, "Invalid content type. Use multipart/form-data for file upload or application/json for URL")
		return
	}

	// Map scraped fields to structured inspection fields (no DB writes)
	inspectionFields, err := h.scraperService.MapToInspectionFields(inspectionData)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Upload inspection with duplicate resolution
	_, redirectToCarID, errorCode, err := h.carService.UploadInspectionToDraft(carID, userID, inspectionFields, h.scraperService)
	if err != nil {
		if errorCode != "" {
			// Return error with code for client handling
			response := models.BookUploadErrorResponse{
				Message:         err.Error(),
				Code:            errorCode,
				Action:          "", 
				RedirectToCarID: redirectToCarID, // สำคัญมาก Frontend ต้องใช้ค่านี้
			}
			
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			if encodeErr := json.NewEncoder(w).Encode(response); encodeErr != nil {
				utils.WriteError(w, http.StatusInternalServerError, "Failed to encode error response")
			}
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to upload inspection: %v", err))
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

	utils.WriteJSON(w, http.StatusOK, payload, "Vehicle inspection processed successfully")
}

// RestoreProgress handles GET /api/cars/{id}/restore-progress
func (h *CarHandler) RestoreProgress(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by auth middleware)
	userID, ok := middleware.GetUserIDFromContext(r)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Check if user is a seller
	isSeller, err := h.userService.IsSeller(userID)
	if err != nil || !isSeller {
		utils.WriteError(w, http.StatusForbidden, "Only sellers can restore progress")
		return
	}

	// Extract car ID from URL
	carID, err := utils.ExtractIDFromPath(r.URL.Path, "/api/cars/")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	// Get the car data with images and inspection
	carWithImages, err := h.carService.GetCarWithImages(carID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get restored car data: %v", err))
		return
	}

	// Check ownership - user can only restore progress from their own car
	if carWithImages.Car.SellerID != userID {
		utils.WriteError(w, http.StatusForbidden, "You can only restore progress from your own cars")
		return
	}
	// Enrich with labels and flatten into car payload
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Translate car to display-ready format (includes InspectionDisplay conversion)
	display, err := h.carService.TranslateCarForDisplay(&carWithImages.Car, lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to translate car data: %v", err))
		return
	}

	// Enrich images with URLs for display
	enrichedImages := make([]models.CarImageMetadata, len(carWithImages.Images))
	for i, img := range carWithImages.Images {
		enrichedImages[i] = img
		enrichedImages[i].URL = fmt.Sprintf("/api/cars/images/%d", img.ID)
	}

	// Return response with proper types
	response := models.CarDetailResponse{
		Car:        display.CarDisplay,
		Images:     enrichedImages,
		Inspection: display.InspectionDisplay,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}
