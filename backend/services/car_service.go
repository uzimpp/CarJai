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

const (
	MaxImageSize    = 50 * 1024 * 1024 // 50MB in bytes
	MaxImagesPerCar = 12
	MinImagesPerCar = 5 // Minimum 5 images required to publish
)

// ValidationError represents a validation error with a specific code
type ValidationError struct {
	Code    string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

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

// CreateCar creates a new car listing (simplified for drafts; allows empty chassis for ephemeral drafts)
func (s *CarService) CreateCar(sellerID int, req *models.CreateCarRequest) (*models.Car, error) {
	// Set default status if not provided
	status := "draft"
	if req.Status != nil {
		status = *req.Status

		// Cannot create a car with "active" status directly (must upload images first)
		if status == "active" {
			return nil, fmt.Errorf("cannot create car with 'active' status: must upload at least %d images first", MinImagesPerCar)
		}
	}

	// Allow empty chassisNumber for initial ephemeral drafts (will be set on book upload)
	chassisNumber := req.ChassisNumber
	if chassisNumber == "" {
		chassisNumber = fmt.Sprintf("DRAFT-%d-%d", sellerID, time.Now().Unix())
	}

	car := &models.Car{
		SellerID:           sellerID,
		ChassisNumber:      chassisNumber,
		Year:               req.Year,
		Mileage:            req.Mileage,
		Price:              req.Price,
		ProvinceID:         req.ProvinceID,
		ConditionRating:    req.ConditionRating,
		BodyTypeCode:       req.BodyTypeCode,
		TransmissionCode:   req.TransmissionCode,
		DrivetrainCode:     req.DrivetrainCode,
		BrandName:          req.BrandName,
		ModelName:          req.ModelName,
		SubmodelName:       req.SubmodelName,
		Seats:              req.Seats,
		Doors:              req.Doors,
		EngineCC:           req.EngineCC,
		Prefix:             req.Prefix,
		Number:             req.Number,
		Description:        req.Description,
		IsFlooded:          req.IsFlooded,
		IsHeavilyDamaged:   req.IsHeavilyDamaged,
		BookUploaded:       req.BookUploaded,
		InspectionUploaded: req.InspectionUploaded,
		Status:             status,
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

	// Validate step-2 access
	if err := s.validateStep2Access(car, req); err != nil {
		return err
	}

	// If trying to change status to "active", run full publish validation
	if req.Status != nil && *req.Status == "active" && car.Status != "active" {
		ready, issues := s.ValidatePublish(carID)
		if !ready {
			return fmt.Errorf("cannot publish car: %v", issues)
		}
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
func (s *CarService) AutoSaveDraft(carID, userID int, req *models.UpdateCarRequest, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization
	if err := s.checkCarOwnership(car, userID, isAdmin); err != nil {
		return err
	}

	// Forbid editing read-only fields (colors come from inspection; status via dedicated endpoint)
	if req.Status != nil {
		return fmt.Errorf("cannot change status via draft endpoint; use PUT /api/cars/{id}/status instead")
	}
	if req.InspectionUploaded != nil {
		return fmt.Errorf("cannot modify inspection_uploaded flag via draft endpoint")
	}
	if req.BookUploaded != nil {
		return fmt.Errorf("cannot modify book_uploaded flag via draft endpoint")
	}
	if req.ChassisNumber != nil {
		return fmt.Errorf("cannot modify chassis number via draft endpoint")
	}

	// Map text fields to IDs if provided
	if err := s.mapTextFieldsToIDs(req, car); err != nil {
		// Log error but don't fail - autosave is lenient
		// In production, you might want to return issues in stepStatus
	}

	// Validate step-2 access (still enforce document upload requirement)
	if err := s.validateStep2Access(car, req); err != nil {
		return err
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

// validateStep2Access checks if step-2 fields can be edited
func (s *CarService) validateStep2Access(car *models.Car, req *models.UpdateCarRequest) error {
	canEditStep2 := s.CanEditStep2(car)

	// Step-2 fields: body_type, transmission, drivetrain, model/submodel, mileage, year, price, description, condition_rating, seats/doors, flooded/damaged
	if !canEditStep2 {
		// Prevent editing step-2 fields if documents not uploaded
		if req.BodyTypeCode != nil || req.TransmissionCode != nil || req.DrivetrainCode != nil ||
			req.ModelName != nil || req.SubmodelName != nil || req.Mileage != nil ||
			req.Year != nil || req.Price != nil || req.Description != nil ||
			req.ConditionRating != nil || req.Seats != nil || req.Doors != nil ||
			req.IsFlooded != nil || req.IsHeavilyDamaged != nil {
			return fmt.Errorf("cannot edit car details until both vehicle book and inspection are uploaded")
		}
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
	if req.BookUploaded != nil {
		car.BookUploaded = *req.BookUploaded
	}
	if req.InspectionUploaded != nil {
		car.InspectionUploaded = *req.InspectionUploaded
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

// GetCarWithImages retrieves a car with its image metadata
func (s *CarService) GetCarWithImages(carID int) (*models.CarWithImages, error) {
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return nil, err
	}

	images, err := s.imageRepo.GetCarImagesMetadata(carID)
	if err != nil {
		return nil, err
	}

	return &models.CarWithImages{
		Car:    *car,
		Images: images,
	}, nil
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
	if !car.BookUploaded {
		issues = append(issues, "Vehicle registration book must be uploaded")
	}
	if !car.InspectionUploaded {
		issues = append(issues, "Vehicle inspection document must be uploaded")
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

// CanEditStep2 checks if step 2 fields can be edited (both documents must be uploaded)
func (s *CarService) CanEditStep2(car *models.Car) bool {
	return car.BookUploaded && car.InspectionUploaded
}

// CreateCarFromBook creates a draft car from vehicle registration book OCR
func (s *CarService) CreateCarFromBook(sellerID int, bookFields *BookFields) (*models.Car, error) {
	// Create draft car with extracted fields
	car := &models.Car{
		SellerID:      sellerID,
		ChassisNumber: bookFields.ChassisNumber,
		BrandName:     bookFields.BrandName,
		ModelName:     bookFields.ModelName,
		Year:          bookFields.Year,
		EngineCC:      bookFields.EngineCC,
		Seats:         bookFields.Seats,
		Status:        "draft",
		BookUploaded:  true,
	}

	// Parse registration number if provided
	if bookFields.RegistrationNumber != "" {
		// TODO: Parse prefix and number from registration (e.g., "กข 1234 กรุงเทพ")
		// For now, store the whole thing as number
		car.Number = &bookFields.RegistrationNumber
	}

	err := s.carRepo.CreateCar(car)
	if err != nil {
		return nil, fmt.Errorf("failed to create car: %w", err)
	}

	return car, nil
}

// InspectionAttachResult contains the result of attaching inspection data
type InspectionAttachResult struct {
	ChassisMatch      bool
	BookChassis       string
	InspectionChassis string
}

// AttachInspection attaches inspection data to a car and validates chassis match
func (s *CarService) AttachInspection(carID int, sellerID int, inspectionData map[string]string, scraperService *ScraperService) (*InspectionAttachResult, error) {
	// Get the car to check ownership and chassis
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return nil, fmt.Errorf("failed to get car: %w", err)
	}

	// Check ownership
	if car.SellerID != sellerID {
		return nil, fmt.Errorf("unauthorized: you can only attach inspection to your own cars")
	}

	// Check if book has been uploaded
	if !car.BookUploaded {
		return nil, &ValidationError{Code: "BOOK_REQUIRED", Message: "Vehicle registration book must be uploaded before inspection"}
	}

	// Extract chassis from inspection data (requires helper in scraperService or a known key)
	inspectionChassis := scraperService.ExtractChassisFromInspection(inspectionData)
	if inspectionChassis == "" {
		return nil, fmt.Errorf("chassis number not found in inspection document")
	}

	// Normalize both chassis numbers for comparison
	normalizedBookChassis := utils.NormalizeChassis(car.ChassisNumber)
	normalizedInspectionChassis := utils.NormalizeChassis(inspectionChassis)

	// Check if they match
	chassisMatch := normalizedBookChassis == normalizedInspectionChassis

	// Create inspection result (storing minimal data for now)
	inspection := &models.InspectionResult{
		CarID: carID,
	}

	// Parse inspection fields if available
	// TODO: Map more fields from inspectionData to inspection struct

	err = s.inspectionRepo.CreateInspectionResult(inspection)
	if err != nil {
		return nil, fmt.Errorf("failed to create inspection: %w", err)
	}

	// Derive colors from inspectionData (if present) and save ordered 1–3
	if colorLabels := scraperService.ExtractColorsFromInspection(inspectionData); len(colorLabels) > 0 {
		// Normalize labels to color IDs via repository helper (by label or code)
		// Fallback: if >3, apply DLT rules externally (assumed handled in ExtractColors)
		// For simplicity here, assume returned list length ≤3 and ordered
		// Map labels to IDs by ILIKE
		// NOTE: We keep this resilient; absence of colors is allowed but will block publish
		if ids, err := s.colorRepo.LookupColorIDsByLabels(colorLabels); err == nil && len(ids) > 0 {
			if err := s.colorRepo.SetCarColors(carID, ids); err != nil {
				return nil, fmt.Errorf("failed to set colors: %w", err)
			}
		}
	}

	// Mark inspection as uploaded
	inspectionUploaded := true
	updateReq := &models.UpdateCarRequest{InspectionUploaded: &inspectionUploaded}
	if err := s.UpdateCar(carID, sellerID, updateReq, false); err != nil {
		return nil, fmt.Errorf("failed to update car: %w", err)
	}

	// Return the result with chassis match status
	return &InspectionAttachResult{
		ChassisMatch:      chassisMatch,
		BookChassis:       normalizedBookChassis,
		InspectionChassis: normalizedInspectionChassis,
	}, nil
}
