package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ValidationError represents a validation error with a code for client handling
type ValidationError struct {
	Code    string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// Error code constants for standardized error handling
const (
	// Book upload errors
	ErrCodeCarDuplicateOwnDraftRedirect = "CAR_DUPLICATE_OWN_DRAFT_REDIRECT"
	ErrCodeCarDuplicateOwnDraft         = "CAR_DUPLICATE_OWN_DRAFT"
	ErrCodeCarDuplicateOwnActive        = "CAR_DUPLICATE_OWN_ACTIVE"
	ErrCodeCarDuplicateOwnSold          = "CAR_DUPLICATE_OWN_SOLD"
	ErrCodeCarDuplicateOwnDeleted       = "CAR_DUPLICATE_OWN_DELETED"
	ErrCodeCarDuplicateOtherOwned       = "CAR_DUPLICATE_OTHER_OWNED"
	ErrCodeCarMultipleDrafts            = "CAR_MULTIPLE_DRAFTS"

	// Inspection errors
	ErrCodeInspectionChassisMismatch = "INSPECTION_CHASSIS_MISMATCH"
	ErrCodeBookRequired              = "BOOK_REQUIRED"

	// Validation errors
	ErrCodeValidationError = "VALIDATION_ERROR"
	ErrCodeUnauthorized    = "UNAUTHORIZED"
	ErrCodeNotFound        = "NOT_FOUND"
)

const (
	MaxImageSize    = 50 * 1024 * 1024 // 50MB in bytes
	MaxImagesPerCar = 12
	MinImagesPerCar = 5 // Minimum 5 images required to publish
)

var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// CarService handles car-related business logic
type CarService struct {
	carRepo        *models.CarRepository
	imageRepo      *models.CarImageRepository
	inspectionRepo *models.InspectionRepository
	colorRepo      *models.CarColorRepository
	fuelRepo       *models.CarFuelRepository
}

// NewCarService creates a new car service
func NewCarService(
	carRepo *models.CarRepository,
	imageRepo *models.CarImageRepository,
	inspectionRepo *models.InspectionRepository,
	colorRepo *models.CarColorRepository,
	fuelRepo *models.CarFuelRepository,
) *CarService {
	return &CarService{
		carRepo:        carRepo,
		imageRepo:      imageRepo,
		inspectionRepo: inspectionRepo,
		colorRepo:      colorRepo,
		fuelRepo:       fuelRepo,
	}
}

// CreateCar creates a new empty draft car (ephemeral)
// All fields are initialized to defaults; actual data comes from book upload
func (s *CarService) CreateCar(sellerID int) (*models.Car, error) {
	// Create empty draft with flags set to false
	car := &models.Car{
		SellerID: sellerID,
		Status:   "draft",
	}

	err := s.carRepo.CreateCar(car)
	if err != nil {
		return nil, err
	}

	return car, nil
}

// GetCarByID retrieves a car by ID
func (s *CarService) GetCarByID(carID int) (*models.Car, error) {
	return s.carRepo.GetCarByID(carID)
}

// GetCarsBySellerID retrieves all cars for a seller
func (s *CarService) GetCarsBySellerID(sellerID int) ([]models.Car, error) {
	return s.carRepo.GetCarsBySellerID(sellerID)
}

// GetCarsBySellerIDWithImages retrieves all cars for a seller with their images
func (s *CarService) GetCarsBySellerIDWithImages(sellerID int) ([]models.CarListingWithImages, error) {
	cars, err := s.carRepo.GetCarsBySellerID(sellerID)
	if err != nil {
		return nil, err
	}

	var listings []models.CarListingWithImages
	for _, car := range cars {
		// Get images for this car
		images, err := s.imageRepo.GetCarImagesMetadata(car.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get images for car %d: %w", car.ID, err)
		}

		// Combine everything into a flat listing structure
		listing := models.CarListingWithImages{
			ID:               car.ID,
			SellerID:         car.SellerID,
			Year:             car.Year,
			Mileage:          car.Mileage,
			Price:            car.Price,
			ProvinceID:       car.ProvinceID,
			ConditionRating:  car.ConditionRating,
			BodyTypeCode:     car.BodyTypeCode,
			TransmissionCode: car.TransmissionCode,
			DrivetrainCode:   car.DrivetrainCode,
			Seats:            car.Seats,
			Doors:            car.Doors,
			BrandName:        car.BrandName,
			ModelName:        car.ModelName,
			SubmodelName:     car.SubmodelName,
			Status:           car.Status,
			CreatedAt:        car.CreatedAt,
			UpdatedAt:        car.UpdatedAt,
			Images:           images,
		}

		listings = append(listings, listing)
	}

	return listings, nil
}

// SearchActiveCars retrieves active car listings with search/filter support
func (s *CarService) SearchActiveCars(req *models.SearchCarsRequest) ([]models.Car, int, error) {
	// Set defaults
	if req.Status == "" {
		req.Status = "active"
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Offset < 0 {
		req.Offset = 0
	}

	return s.carRepo.GetActiveCars(req)
}

// SearchActiveCarsWithImages retrieves active car listings with images and details
func (s *CarService) SearchActiveCarsWithImages(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error) {
	// Set defaults
	if req.Status == "" {
		req.Status = "active"
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Offset < 0 {
		req.Offset = 0
	}

	// Get cars from repository
	cars, total, err := s.carRepo.GetActiveCars(req)
	if err != nil {
		return nil, 0, err
	}

	// Enrich with images
	var listings []models.CarListingWithImages
	for _, car := range cars {
		// Get images for this car
		images, err := s.imageRepo.GetCarImagesMetadata(car.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get images for car %d: %w", car.ID, err)
		}

		// Combine everything into a flat listing structure
		listing := models.CarListingWithImages{
			ID:               car.ID,
			SellerID:         car.SellerID,
			Year:             car.Year,
			Mileage:          car.Mileage,
			Price:            car.Price,
			ProvinceID:       car.ProvinceID,
			ConditionRating:  car.ConditionRating,
			BodyTypeCode:     car.BodyTypeCode,
			TransmissionCode: car.TransmissionCode,
			DrivetrainCode:   car.DrivetrainCode,
			Seats:            car.Seats,
			Doors:            car.Doors,
			BrandName:        car.BrandName,
			ModelName:        car.ModelName,
			SubmodelName:     car.SubmodelName,
			Status:           car.Status,
			CreatedAt:        car.CreatedAt,
			UpdatedAt:        car.UpdatedAt,
			Images:           images,
		}

		listings = append(listings, listing)
	}

	return listings, total, nil
}

// UpdateCar updates a car listing with step-2 guards and validations
func (s *CarService) UpdateCar(carID, userID int, req *models.UpdateCarRequest, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization
	if err := s.checkCarOwnership(car, userID, isAdmin); err != nil {
		return err
	}

	// If trying to change status to "active", run full publish validation
	if req.Status != nil && *req.Status == "active" && car.Status != "active" {
		ready, issues := s.ValidatePublish(carID)
		if !ready {
			return fmt.Errorf("cannot publish car: %v", issues)
		}
	}

	// Prevent changing chassis number via general update
	if req.ChassisNumber != nil {
		return fmt.Errorf("cannot modify chassis number via update endpoint")
	}

	// Validate mileage is non-decreasing
	if err := s.validateMileage(car, req.Mileage); err != nil {
		return err
	}

	// Apply updates to car
	s.applyCarUpdates(car, req)

	return s.carRepo.UpdateCar(car)
}

// AutoSaveDraft saves a car draft without strict validation (for auto-save functionality)
func (s *CarService) AutoSaveDraft(carID, userID int, req *models.UpdateCarRequest) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization
	if err := s.checkCarOwnership(car, userID, false); err != nil {
		return err
	}

	// Forbid editing read-only fields (chassisNumber comes from book upload; status via dedicated endpoint)
	if req.ChassisNumber != nil {
		return fmt.Errorf("cannot modify chassis number via draft endpoint; upload registration book")
	}
	if req.Status != nil {
		return fmt.Errorf("cannot change status via draft endpoint; use PUT /api/cars/{id}/status instead")
	}

	// Map text fields to IDs if provided
	if err := s.mapTextFieldsToIDs(req, car); err != nil {
		// Log error but don't fail - autosave is lenient
		// In production, you might want to return issues in stepStatus
	}

	// Validate mileage is non-decreasing (basic validation even in draft)
	if err := s.validateMileage(car, req.Mileage); err != nil {
		return err
	}

	// Apply updates to car basic fields
	s.applyCarUpdates(car, req)

	// Replace fuels if provided (from either FuelCodes or FuelLabels)
	if req.FuelCodes != nil {
		if err := s.fuelRepo.SetCarFuels(carID, req.FuelCodes); err != nil {
			return err
		}
	} else if req.FuelLabels != nil {
		// Map fuel labels to codes
		codes, err := s.carRepo.LookupFuelCodesByLabels(req.FuelLabels)
		if err == nil && len(codes) > 0 {
			if err := s.fuelRepo.SetCarFuels(carID, codes); err != nil {
				return err
			}
		}
	}

	return s.carRepo.UpdateCar(car)
}

// mapTextFieldsToIDs maps text field inputs to their corresponding code fields
func (s *CarService) mapTextFieldsToIDs(req *models.UpdateCarRequest, car *models.Car) error {
	// Map province name to ID (provinces still use IDs, not codes)
	if req.ProvinceNameTh != nil && *req.ProvinceNameTh != "" {
		if id, err := s.carRepo.LookupProvinceByName(*req.ProvinceNameTh); err == nil && id != nil {
			req.ProvinceID = id
		}
	}

	// Map body type name to code
	if req.BodyTypeName != nil && *req.BodyTypeName != "" {
		if code, err := s.carRepo.LookupBodyTypeByName(*req.BodyTypeName); err == nil && code != nil {
			req.BodyTypeCode = code
		}
	}

	// Map transmission name to code
	if req.TransmissionName != nil && *req.TransmissionName != "" {
		if code, err := s.carRepo.LookupTransmissionByName(*req.TransmissionName); err == nil && code != nil {
			req.TransmissionCode = code
		}
	}

	// Map drivetrain name to code
	if req.DrivetrainName != nil && *req.DrivetrainName != "" {
		if code, err := s.carRepo.LookupDrivetrainByName(*req.DrivetrainName); err == nil && code != nil {
			req.DrivetrainCode = code
		}
	}

	// Fuel labels are handled separately in AutoSaveDraft

	return nil
}

// ComputeStep2Status evaluates readiness of Step 2 (specifications)
func (s *CarService) ComputeStep2Status(carID int) (bool, []string) {
	issues := []string{}
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return false, []string{fmt.Sprintf("Failed to get car: %v", err)}
	}
	if car.BodyTypeCode == nil || *car.BodyTypeCode == "" {
		issues = append(issues, "Body type required")
	}
	if car.TransmissionCode == nil || *car.TransmissionCode == "" {
		issues = append(issues, "Transmission required")
	}
	if car.DrivetrainCode == nil || *car.DrivetrainCode == "" {
		issues = append(issues, "Drivetrain required")
	}
	if car.ModelName == nil || *car.ModelName == "" {
		issues = append(issues, "Model name required")
	}
	if car.Mileage == nil {
		issues = append(issues, "Mileage required")
	}
	if car.ConditionRating == nil || *car.ConditionRating < 1 || *car.ConditionRating > 5 {
		issues = append(issues, "Condition rating required (1-5)")
	}
	// Fuels presence (informational here; enforced on publish)
	fuels, err := s.fuelRepo.GetCarFuels(carID)
	if err == nil && len(fuels) == 0 {
		issues = append(issues, "At least one fuel type recommended")
	}
	return len(issues) == 0, issues
}

// ComputeStep3Status evaluates readiness of Step 3 (details + images)
func (s *CarService) ComputeStep3Status(carID int) (bool, []string) {
	issues := []string{}
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return false, []string{fmt.Sprintf("Failed to get car: %v", err)}
	}
	if car.Description == nil || len(*car.Description) < 10 {
		issues = append(issues, "Description must be at least 10 characters")
	}
	if car.Description != nil && len(*car.Description) > 200 {
		issues = append(issues, "Description must not exceed 200 characters")
	}
	if car.Price == nil || *car.Price <= 0 {
		issues = append(issues, "Valid price required")
	}
	if car.ProvinceID == nil {
		issues = append(issues, "Province required")
	}
	if car.Prefix == nil || *car.Prefix == "" {
		issues = append(issues, "License plate prefix required")
	}
	if car.Number == nil || *car.Number == "" {
		issues = append(issues, "License plate number required")
	}
	// Image count
	cnt, err := s.imageRepo.CountCarImages(carID)
	if err == nil {
		if cnt < MinImagesPerCar {
			issues = append(issues, fmt.Sprintf("At least %d images required", MinImagesPerCar))
		}
		if cnt > MaxImagesPerCar {
			issues = append(issues, fmt.Sprintf("Maximum %d images allowed", MaxImagesPerCar))
		}
	}
	return len(issues) == 0, issues
}

// checkCarOwnership validates that the user owns the car or is an admin
func (s *CarService) checkCarOwnership(car *models.Car, userID int, isAdmin bool) error {
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only update your own cars")
	}
	return nil
}

// validateMileage ensures mileage only increases
func (s *CarService) validateMileage(car *models.Car, newMileage *int) error {
	if newMileage != nil && car.Mileage != nil && *newMileage < *car.Mileage {
		return fmt.Errorf("mileage cannot decrease (current: %d, requested: %d)", *car.Mileage, *newMileage)
	}
	return nil
}

// applyCarUpdates applies all provided updates to the car
func (s *CarService) applyCarUpdates(car *models.Car, req *models.UpdateCarRequest) {
	if req.Year != nil {
		car.Year = req.Year
	}
	if req.Mileage != nil {
		car.Mileage = req.Mileage
	}
	if req.Price != nil {
		car.Price = req.Price
	}
	if req.ProvinceID != nil {
		car.ProvinceID = req.ProvinceID
	}
	if req.ConditionRating != nil {
		car.ConditionRating = req.ConditionRating
	}
	if req.BodyTypeCode != nil {
		car.BodyTypeCode = req.BodyTypeCode
	}
	if req.TransmissionCode != nil {
		car.TransmissionCode = req.TransmissionCode
	}
	if req.DrivetrainCode != nil {
		car.DrivetrainCode = req.DrivetrainCode
	}
	if req.Seats != nil {
		car.Seats = req.Seats
	}
	if req.Doors != nil {
		car.Doors = req.Doors
	}
	if req.ModelName != nil {
		car.ModelName = req.ModelName
	}
	if req.SubmodelName != nil {
		car.SubmodelName = req.SubmodelName
	}
	if req.Description != nil {
		car.Description = req.Description
	}
	if req.IsFlooded != nil {
		car.IsFlooded = *req.IsFlooded
	}
	if req.IsHeavilyDamaged != nil {
		car.IsHeavilyDamaged = *req.IsHeavilyDamaged
	}
	if req.Prefix != nil {
		car.Prefix = req.Prefix
	}
	if req.Number != nil {
		car.Number = req.Number
	}
	if req.Status != nil {
		car.Status = *req.Status
	}
}

// DeleteCar deletes a car listing
func (s *CarService) DeleteCar(carID, userID int, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization - only owner or admin can delete
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only delete your own cars")
	}

	return s.carRepo.DeleteCar(carID)
}

// UploadCarImages handles multiple image uploads for a car
func (s *CarService) UploadCarImages(carID, userID int, files []*multipart.FileHeader, isAdmin bool) ([]models.CarImageMetadata, error) {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return nil, err
	}

	// Check authorization - only owner or admin can upload images
	if !isAdmin && car.SellerID != userID {
		return nil, fmt.Errorf("unauthorized: you can only upload images to your own cars")
	}

	// Check current image count
	currentCount, err := s.imageRepo.CountCarImages(carID)
	if err != nil {
		return nil, err
	}

	// Check if adding new images would exceed the limit
	if currentCount+len(files) > MaxImagesPerCar {
		return nil, fmt.Errorf("cannot upload %d images: car already has %d images (max %d)", len(files), currentCount, MaxImagesPerCar)
	}

	var uploadedImages []models.CarImageMetadata

	for i, fileHeader := range files {
		// Validate file size
		if fileHeader.Size > MaxImageSize {
			return nil, fmt.Errorf("image %s exceeds maximum size of 50MB", fileHeader.Filename)
		}

		// Open the file
		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
		}
		defer file.Close()

		// Read file data
		fileData, err := io.ReadAll(file)
		if err != nil {
			return nil, fmt.Errorf("failed to read file %s: %w", fileHeader.Filename, err)
		}

		// Detect content type
		contentType := http.DetectContentType(fileData)

		// Validate content type
		if !AllowedImageTypes[contentType] {
			return nil, fmt.Errorf("invalid image type %s for file %s (allowed: JPEG, PNG, WebP, GIF)", contentType, fileHeader.Filename)
		}

		// Create image record
		image := &models.CarImage{
			CarID:        carID,
			ImageData:    fileData,
			ImageType:    contentType,
			ImageSize:    int(fileHeader.Size),
			DisplayOrder: currentCount + i,
		}

		// Save to database
		err = s.imageRepo.CreateCarImage(image)
		if err != nil {
			return nil, fmt.Errorf("failed to save image %s: %w", fileHeader.Filename, err)
		}

		// Add to uploaded images list
		uploadedImages = append(uploadedImages, models.CarImageMetadata{
			ID:           image.ID,
			CarID:        image.CarID,
			ImageType:    image.ImageType,
			ImageSize:    image.ImageSize,
			DisplayOrder: image.DisplayOrder,
			UploadedAt:   image.UploadedAt,
		})
	}

	return uploadedImages, nil
}

// GetCarImage retrieves a single image with data
func (s *CarService) GetCarImage(imageID int) (*models.CarImage, error) {
	return s.imageRepo.GetCarImageByID(imageID)
}

// DeleteCarImage deletes a single image
func (s *CarService) DeleteCarImage(imageID, userID int, isAdmin bool) error {
	// Get the image to find the car
	image, err := s.imageRepo.GetCarImageByID(imageID)
	if err != nil {
		return err
	}

	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(image.CarID)
	if err != nil {
		return err
	}

	// Check authorization - only owner or admin can delete images
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only delete images from your own cars")
	}

	return s.imageRepo.DeleteCarImage(imageID)
}

// GetCarWithImages retrieves a car with its image metadata and inspection data (optimized with fewer queries)
func (s *CarService) GetCarWithImages(carID int) (*models.CarWithImages, error) {
	// Use optimized method that fetches everything in 3 queries instead of separate calls
	car, images, inspection, err := s.carRepo.GetCarWithImagesAndInspection(carID)
	if err != nil {
		return nil, err
	}

	return &models.CarWithImages{
		Car:        *car,
		Images:     images,
		Inspection: inspection,
	}, nil
}

// GetCarFuelLabels returns the fuel labels for a car in the requested language
func (s *CarService) GetCarFuelLabels(carID int, lang string) ([]string, error) {
	if lang == "" {
		lang = "en"
	}
	codes, err := s.fuelRepo.GetCarFuels(carID)
	if err != nil {
		return nil, err
	}
	if len(codes) == 0 {
		return []string{}, nil
	}
	labels, err := s.carRepo.GetFuelLabelsByCodes(codes, lang)
	if err != nil {
		return nil, err
	}
	return labels, nil
}

// GetCarColorLabels returns the color labels for a car in the requested language
func (s *CarService) GetCarColorLabels(carID int, lang string) ([]string, error) {
	if lang == "" {
		lang = "en"
	}
	codes, err := s.colorRepo.GetCarColors(carID)
	if err != nil {
		return nil, err
	}
	if len(codes) == 0 {
		return []string{}, nil
	}
	labels, err := s.carRepo.GetColorLabelsByCodes(codes, lang)
	if err != nil {
		return nil, err
	}
	return labels, nil
}

// (Removed unused UpdateImageDisplayOrder; bulk reorder endpoint is used instead)

// ReorderImagesBulk reorders all images for a car in one transaction
func (s *CarService) ReorderImagesBulk(carID int, imageIDs []int, userID int, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only reorder images for your own cars")
	}

	// Validate image count (5-12)
	if len(imageIDs) < MinImagesPerCar || len(imageIDs) > MaxImagesPerCar {
		return fmt.Errorf("must provide between %d and %d images", MinImagesPerCar, MaxImagesPerCar)
	}

	// Verify all images belong to this car
	existingImages, err := s.imageRepo.GetCarImagesMetadata(carID)
	if err != nil {
		return fmt.Errorf("failed to get existing images: %w", err)
	}

	if len(existingImages) != len(imageIDs) {
		return fmt.Errorf("image count mismatch: car has %d images but received %d IDs", len(existingImages), len(imageIDs))
	}

	// Create a map of valid image IDs for this car
	validIDs := make(map[int]bool)
	for _, img := range existingImages {
		validIDs[img.ID] = true
	}

	// Verify all provided IDs are valid
	for _, id := range imageIDs {
		if !validIDs[id] {
			return fmt.Errorf("image ID %d does not belong to car %d", id, carID)
		}
	}

	// Perform bulk reorder
	return s.imageRepo.ReorderImages(imageIDs)
}

// SetCarFuels sets fuel types for a car
func (s *CarService) SetCarFuels(carID int, fuelCodes []string, userID int, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only set fuels for your own cars")
	}

	// Validate fuel codes (at least one)
	if len(fuelCodes) < 1 {
		return fmt.Errorf("must provide at least one fuel type")
	}

	// Perform the update
	return s.fuelRepo.SetCarFuels(carID, fuelCodes)
}

// ValidatePublish checks if a car is ready to be published (Step 4 validation)
func (s *CarService) ValidatePublish(carID int) (bool, []string) {
	var issues []string

	// Get the car
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		issues = append(issues, fmt.Sprintf("Failed to get car: %v", err))
		return false, issues
	}

	// Step 1: Check document uploads
	if car.ChassisNumber == nil || *car.ChassisNumber == "" {
		issues = append(issues, "Chassis number is required (upload vehicle registration book)")
	}

	// Step 2: Check vehicle specifications
	if car.BodyTypeCode == nil || *car.BodyTypeCode == "" {
		issues = append(issues, "Body type is required")
	}
	if car.TransmissionCode == nil || *car.TransmissionCode == "" {
		issues = append(issues, "Transmission is required")
	}
	if car.DrivetrainCode == nil || *car.DrivetrainCode == "" {
		issues = append(issues, "Drivetrain is required")
	}
	if car.ModelName == nil || *car.ModelName == "" {
		issues = append(issues, "Model name is required")
	}
	if car.Mileage == nil {
		issues = append(issues, "Mileage is required")
	}
	if car.ConditionRating == nil {
		issues = append(issues, "Condition rating is required")
	} else if *car.ConditionRating < 1 || *car.ConditionRating > 5 {
		issues = append(issues, "Condition rating must be between 1 and 5")
	}

	// Check fuel types
	fuelCodes, err := s.fuelRepo.GetCarFuels(carID)
	if err != nil {
		issues = append(issues, fmt.Sprintf("Failed to check fuel types: %v", err))
	} else if len(fuelCodes) == 0 {
		issues = append(issues, "At least one fuel type is required")
	}

	// Step 3: Check listing details
	if car.Price == nil || *car.Price <= 0 {
		issues = append(issues, "Valid price is required")
	}
	if car.ProvinceID == nil {
		issues = append(issues, "Province is required")
	}
	if car.Prefix == nil || *car.Prefix == "" {
		issues = append(issues, "License plate prefix is required")
	}
	if car.Number == nil || *car.Number == "" {
		issues = append(issues, "License plate number is required")
	}

	// Check description length
	if car.Description == nil || len(*car.Description) < 10 {
		issues = append(issues, "Description must be at least 10 characters")
	} else if len(*car.Description) > 200 {
		issues = append(issues, "Description must not exceed 200 characters")
	}

	// Check image count (5-12 required)
	imageCount, err := s.imageRepo.CountCarImages(carID)
	if err != nil {
		issues = append(issues, fmt.Sprintf("Failed to count images: %v", err))
	} else if imageCount < MinImagesPerCar {
		issues = append(issues, fmt.Sprintf("At least %d images are required (currently has %d)", MinImagesPerCar, imageCount))
	} else if imageCount > MaxImagesPerCar {
		issues = append(issues, fmt.Sprintf("Maximum %d images allowed (currently has %d)", MaxImagesPerCar, imageCount))
	}

	// Check colors (1-3 required)
	colorIDs, err := s.colorRepo.GetCarColors(carID)
	if err != nil {
		issues = append(issues, fmt.Sprintf("Failed to check colors: %v", err))
	} else if len(colorIDs) == 0 {
		issues = append(issues, "At least one color is required")
	} else if len(colorIDs) > 3 {
		issues = append(issues, "Maximum 3 colors allowed")
	}

	return len(issues) == 0, issues
}

// GetColorLabelsByCodes retrieves display labels for color codes
func (s *CarService) GetColorLabelsByCodes(codes []string, lang string) ([]string, error) {
	if lang == "" {
		lang = "en"
	}
	return s.colorRepo.LookupColorLabelsByCodes(codes, lang)
}

// TranslatedCarDisplay provides a display-ready car object with all codes/IDs translated to labels
// This struct matches the frontend expectations for the display block in GET /api/cars/:id
type TranslatedCarDisplay struct {
	// Inspection results as display-ready strings
	CarDisplay        *CarDisplay        `json:"car,omitempty"`
	ImagesDisplay     *ImagesDisplay     `json:"images,omitempty"`
	InspectionDisplay *InspectionDisplay `json:"inspection,omitempty"`
}

type ImagesDisplay struct {
	Images []ImageMetadata `json:"images,omitempty"`
}
type ImageMetadata struct {
	ID  int    `json:"id"`
	URL string `json:"url"`
}
type CarDisplay struct {
	// Core fields (unchanged from Car model)
	ID        int       `json:"id"`
	SellerID  int       `json:"sellerId"`
	Year      *int      `json:"year"`
	Mileage   *int      `json:"mileage"`
	Price     *int      `json:"price"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`

	// Translated reference fields (codes/IDs → human-readable labels)
	BodyType     *string  `json:"bodyType"`     // e.g., "Pickup" (from body_type_code)
	Transmission *string  `json:"transmission"` // e.g., "Manual" (from transmission_code)
	Drivetrain   *string  `json:"drivetrain"`   // e.g., "FWD" (from drivetrain_code)
	FuelTypes    []string `json:"fuelTypes"`    // e.g., ["Gasoline", "LPG"] (from car_fuel codes)
	Colors       []string `json:"colors"`       // e.g., ["White", "Gray"] (from car_colors codes)

	// Car details (unchanged from Car model)
	BrandName    *string `json:"brandName"`
	ModelName    *string `json:"modelName"`
	SubmodelName *string `json:"submodelName"`
	Description  *string `json:"description"`

	// License plate fields
	ChassisNumber *string `json:"chassisNumber"`
	LicensePlate  string  `json:"licensePlate"` // Constructed: "กข 5177 กรุงเทพมหานคร"
	Prefix        *string `json:"prefix"`       // e.g., "กข"
	Number        *string `json:"number"`       // e.g., "5177"
	Province      *string `json:"province"`     // e.g., "Bangkok" (from province_id)

	// Specifications
	Seats    *int `json:"seats"`
	Doors    *int `json:"doors"`
	EngineCC *int `json:"engineCc"`

	// Condition & damage
	ConditionRating  *int `json:"conditionRating"`
	IsFlooded        bool `json:"isFlooded"`
	IsHeavilyDamaged bool `json:"isHeavilyDamaged"`
}

// InspectionDisplay contains stringified inspection results for UI consumption
type InspectionDisplay struct {
	Station            string `json:"station,omitempty"`
	OverallPass        bool   `json:"overallPass,omitempty"`
	BrakeResult        bool   `json:"brakeResult,omitempty"`
	HandbrakeResult    bool   `json:"handbrakeResult,omitempty"`
	AlignmentResult    bool   `json:"alignmentResult,omitempty"`
	NoiseResult        bool   `json:"noiseResult,omitempty"`
	EmissionResult     bool   `json:"emissionResult,omitempty"`
	HornResult         bool   `json:"hornResult,omitempty"`
	SpeedometerResult  bool   `json:"speedometerResult,omitempty"`
	HighLowBeamResult  bool   `json:"highLowBeamResult,omitempty"`
	SignalLightsResult bool   `json:"signalLightsResult,omitempty"`
	OtherLightsResult  bool   `json:"otherLightsResult,omitempty"`
	WindshieldResult   bool   `json:"windshieldResult,omitempty"`
	SteeringResult     bool   `json:"steeringResult,omitempty"`
	WheelsTiresResult  bool   `json:"wheelsTiresResult,omitempty"`
	FuelTankResult     bool   `json:"fuelTankResult,omitempty"`
	ChassisResult      bool   `json:"chassisResult,omitempty"`
	BodyResult         bool   `json:"bodyResult,omitempty"`
	DoorsFloorResult   bool   `json:"doorsFloorResult,omitempty"`
	SeatbeltResult     bool   `json:"seatbeltResult,omitempty"`
	WiperResult        bool   `json:"wiperResult,omitempty"`
}

// TranslateCarForDisplay converts a Car model to a display-ready format with translated labels
// This method queries reference tables to translate codes/IDs to human-readable labels
// lang: "en" for English labels, "th" for Thai labels
func (s *CarService) TranslateCarForDisplay(car *models.Car, lang string) (*TranslatedCarDisplay, error) {
	if lang == "" {
		lang = "en"
	}

	display := &TranslatedCarDisplay{
		CarDisplay: &CarDisplay{
			// Copy core fields
			ID:               car.ID,
			SellerID:         car.SellerID,
			Year:             car.Year,
			Mileage:          car.Mileage,
			Price:            car.Price,
			Status:           car.Status,
			CreatedAt:        car.CreatedAt,
			BrandName:        car.BrandName,
			ModelName:        car.ModelName,
			SubmodelName:     car.SubmodelName,
			Description:      car.Description,
			ChassisNumber:    car.ChassisNumber,
			Prefix:           car.Prefix,
			Number:           car.Number,
			Seats:            car.Seats,
			Doors:            car.Doors,
			EngineCC:         car.EngineCC,
			ConditionRating:  car.ConditionRating,
			IsFlooded:        car.IsFlooded,
			IsHeavilyDamaged: car.IsHeavilyDamaged,
			// Initialize slice fields as empty slices to avoid null in JSON
			FuelTypes: []string{},
			Colors:    []string{},
		},
	}

	// Construct license plate for display (combine prefix + number + province name)
	if car.Prefix != nil && car.Number != nil {
		provinceName := ""
		if car.ProvinceID != nil {
			// Get province name in Thai by default
			if name, err := s.carRepo.GetProvinceLabelByID(*car.ProvinceID, "th"); err == nil && name != "" {
				provinceName = name
			}
		}
		display.CarDisplay.LicensePlate = utils.ConstructLicensePlate(
			*car.Prefix,
			*car.Number,
			provinceName,
		)
	}

	// Status and damage displays
	display.CarDisplay.Status = car.Status
	display.CarDisplay.IsFlooded = car.IsFlooded
	display.CarDisplay.IsHeavilyDamaged = car.IsHeavilyDamaged

	// Translate body type code to label
	if car.BodyTypeCode != nil && *car.BodyTypeCode != "" {
		if label, err := s.carRepo.GetBodyTypeLabelByCode(*car.BodyTypeCode, lang); err == nil && label != "" {
			display.CarDisplay.BodyType = &label
		}
	}

	// Inspection display
	if insp, err := s.inspectionRepo.GetInspectionByCarID(car.ID); err == nil && insp != nil {
		idisp := &InspectionDisplay{}
		if insp.Station != nil {
			idisp.Station = *insp.Station
		}
		if insp.OverallPass != nil {
			idisp.OverallPass = *insp.OverallPass
		}
		if insp.BrakeResult != nil {
			idisp.BrakeResult = *insp.BrakeResult
		}
		if insp.HandbrakeResult != nil {
			idisp.HandbrakeResult = *insp.HandbrakeResult
		}
		if insp.AlignmentResult != nil {
			idisp.AlignmentResult = *insp.AlignmentResult
		}
		if insp.NoiseResult != nil {
			idisp.NoiseResult = *insp.NoiseResult
		}
		if insp.EmissionResult != nil {
			idisp.EmissionResult = *insp.EmissionResult
		}
		if insp.HornResult != nil {
			idisp.HornResult = *insp.HornResult
		}
		if insp.SpeedometerResult != nil {
			idisp.SpeedometerResult = *insp.SpeedometerResult
		}
		if insp.HighLowBeamResult != nil {
			idisp.HighLowBeamResult = *insp.HighLowBeamResult
		}
		if insp.SignalLightsResult != nil {
			idisp.SignalLightsResult = *insp.SignalLightsResult
		}
		if insp.OtherLightsResult != nil {
			idisp.OtherLightsResult = *insp.OtherLightsResult
		}
		if insp.WindshieldResult != nil {
			idisp.WindshieldResult = *insp.WindshieldResult
		}
		if insp.SteeringResult != nil {
			idisp.SteeringResult = *insp.SteeringResult
		}
		if insp.WheelsTiresResult != nil {
			idisp.WheelsTiresResult = *insp.WheelsTiresResult
		}
		if insp.FuelTankResult != nil {
			idisp.FuelTankResult = *insp.FuelTankResult
		}
		if insp.ChassisResult != nil {
			idisp.ChassisResult = *insp.ChassisResult
		}
		if insp.BodyResult != nil {
			idisp.BodyResult = *insp.BodyResult
		}
		if insp.DoorsFloorResult != nil {
			idisp.DoorsFloorResult = *insp.DoorsFloorResult
		}
		if insp.SeatbeltResult != nil {
			idisp.SeatbeltResult = *insp.SeatbeltResult
		}
		if insp.WiperResult != nil {
			idisp.WiperResult = *insp.WiperResult
		}
		display.InspectionDisplay = idisp
	}

	// Translate transmission code to label
	if car.TransmissionCode != nil && *car.TransmissionCode != "" {
		if label, err := s.carRepo.GetTransmissionLabelByCode(*car.TransmissionCode, lang); err == nil && label != "" {
			display.CarDisplay.Transmission = &label
		}
	}

	// Translate drivetrain code to label
	if car.DrivetrainCode != nil && *car.DrivetrainCode != "" {
		if label, err := s.carRepo.GetDrivetrainLabelByCode(*car.DrivetrainCode, lang); err == nil && label != "" {
			display.CarDisplay.Drivetrain = &label
		}
	}

	// Translate province ID to label
	if car.ProvinceID != nil {
		if label, err := s.carRepo.GetProvinceLabelByID(*car.ProvinceID, lang); err == nil && label != "" {
			display.CarDisplay.Province = &label
		}
	}

	// Translate fuel type codes to labels
	fuelCodes, err := s.fuelRepo.GetCarFuels(car.ID)
	if err == nil && len(fuelCodes) > 0 {
		fuelLabels, err := s.carRepo.GetFuelLabelsByCodes(fuelCodes, lang)
		if err == nil {
			display.CarDisplay.FuelTypes = fuelLabels
		}
	}

	// Translate color IDs to labels
	colorCodes, err := s.colorRepo.GetCarColors(car.ID)
	if err == nil && len(colorCodes) > 0 {
		colorLabels, err := s.carRepo.GetColorLabelsByCodes(colorCodes, lang)
		if err == nil {
			display.CarDisplay.Colors = colorLabels
		}
	}
	return display, nil
}
