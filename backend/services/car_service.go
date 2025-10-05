package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
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
	detailsRepo    *models.CarDetailsRepository
	inspectionRepo *models.InspectionRepository
	profileRepo    *ProfileService
}

// NewCarService creates a new car service
func NewCarService(carRepo *models.CarRepository, imageRepo *models.CarImageRepository, detailsRepo *models.CarDetailsRepository, inspectionRepo *models.InspectionRepository, profileService *ProfileService) *CarService {
	return &CarService{
		carRepo:        carRepo,
		imageRepo:      imageRepo,
		detailsRepo:    detailsRepo,
		inspectionRepo: inspectionRepo,
		profileRepo:    profileService,
	}
}

// CreateCar creates a new car listing
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

	// Translate Thai text to English before saving
	province := req.Province
	if province != nil {
		translated := utils.TranslateProvince(*province)
		province = &translated
	}

	color := req.Color
	if color != nil {
		translated := utils.TranslateColor(*color)
		color = &translated
	}

	car := &models.Car{
		SellerID:        sellerID,
		Year:            req.Year,
		Mileage:         req.Mileage,
		Price:           req.Price,
		Province:        province,
		ConditionRating: req.ConditionRating,
		BodyTypeID:      req.BodyTypeID,
		TransmissionID:  req.TransmissionID,
		FuelTypeID:      req.FuelTypeID,
		DrivetrainID:    req.DrivetrainID,
		Seats:           req.Seats,
		Doors:           req.Doors,
		Color:           color,
		Status:          status,
		OCRApplied:      false,
	}

	err := s.carRepo.CreateCar(car)
	if err != nil {
		return nil, err
	}

	// If car details are provided (from OCR or inspection), save them
	if s.hasCarDetails(req) {
		// Translate vehicle type (body style) from Thai to English
		vehicleType := req.VehicleType
		if vehicleType != nil {
			translated := utils.TranslateBodyStyle(*vehicleType)
			vehicleType = &translated
		}

		details := &models.CarDetails{
			CarID:              car.CID,
			BrandName:          req.BrandName,
			ModelName:          req.ModelName,
			RegistrationNumber: req.RegistrationNumber,
			ChassisNumber:      req.ChassisNumber,
			EngineNumber:       req.EngineNumber,
			VehicleType:        vehicleType,
		}

		err := s.detailsRepo.CreateCarDetails(details)
		if err != nil {
			// Log error but don't fail the car creation
			fmt.Printf("Warning: Failed to save car details: %v\n", err)
		}
	}

	// If inspection results are provided (from QR code scraper), save them
	if s.hasInspectionData(req) {
		// Translate all inspection results from Thai to English
		brakeResult := req.BrakeResult
		if brakeResult != nil {
			translated := utils.TranslateInspectionResult(*brakeResult)
			brakeResult = &translated
		}

		alignmentResult := req.WheelAlignmentResult
		if alignmentResult != nil {
			translated := utils.TranslateInspectionResult(*alignmentResult)
			alignmentResult = &translated
		}

		emissionResult := req.EmissionResult
		if emissionResult != nil {
			translated := utils.TranslateInspectionResult(*emissionResult)
			emissionResult = &translated
		}

		chassisCondition := req.ChassisConditionResult
		if chassisCondition != nil {
			translated := utils.TranslateInspectionResult(*chassisCondition)
			chassisCondition = &translated
		}

		inspection := &models.InspectionResult{
			CarID:                car.CID,
			BrakeResult:          brakeResult,
			AlignmentResult:      alignmentResult,
			EmissionResult:       emissionResult,
			BrakePerformance:     req.BrakePerformance,
			HandbrakePerformance: req.HandbrakePerformance,
			EmissionCO:           req.EmissionValue,
			NoiseLevel:           req.NoiseLevel,
			ChassisCondition:     chassisCondition,
		}

		// Parse overall result to boolean if it exists
		if req.OverallResult != nil {
			translated := utils.TranslateInspectionResult(*req.OverallResult)
			pass := (translated == "Pass" || translated == "PASS" || translated == "pass")
			inspection.OverallPass = &pass
		}

		err := s.inspectionRepo.CreateInspectionResult(inspection)
		if err != nil {
			// Log error but don't fail the car creation
			fmt.Printf("Warning: Failed to save inspection results: %v\n", err)
		}
	}

	return car, nil
}

// hasCarDetails checks if any car detail fields are provided
func (s *CarService) hasCarDetails(req *models.CreateCarRequest) bool {
	return req.BrandName != nil || req.ModelName != nil ||
		req.RegistrationNumber != nil || req.ChassisNumber != nil ||
		req.EngineNumber != nil || req.VehicleType != nil
}

// hasInspectionData checks if any inspection fields are provided
func (s *CarService) hasInspectionData(req *models.CreateCarRequest) bool {
	return req.OverallResult != nil || req.BrakePerformance != nil ||
		req.HandbrakePerformance != nil || req.EmissionValue != nil ||
		req.NoiseLevel != nil || req.BrakeResult != nil ||
		req.WheelAlignmentResult != nil || req.EmissionResult != nil ||
		req.ChassisConditionResult != nil
}

// GetCarByID retrieves a car by ID
func (s *CarService) GetCarByID(carID int) (*models.Car, error) {
	return s.carRepo.GetCarByID(carID)
}

// GetCarsBySellerID retrieves all cars for a seller
func (s *CarService) GetCarsBySellerID(sellerID int) ([]models.Car, error) {
	return s.carRepo.GetCarsBySellerID(sellerID)
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

// UpdateCar updates a car listing
func (s *CarService) UpdateCar(carID, userID int, req *models.UpdateCarRequest, isAdmin bool) error {
	// Get the car to check ownership
	car, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return err
	}

	// Check authorization - only owner or admin can update
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only update your own cars")
	}

	// If trying to change status to "active", check minimum images requirement
	if req.Status != nil && *req.Status == "active" && car.Status != "active" {
		imageCount, err := s.imageRepo.CountCarImages(carID)
		if err != nil {
			return fmt.Errorf("failed to count car images: %w", err)
		}
		if imageCount < MinImagesPerCar {
			return fmt.Errorf("cannot publish car: minimum %d images required (currently has %d)", MinImagesPerCar, imageCount)
		}
	}

	// Update only provided fields
	if req.Year != nil {
		car.Year = req.Year
	}
	if req.Mileage != nil {
		car.Mileage = req.Mileage
	}
	if req.Price != nil {
		car.Price = *req.Price
	}
	if req.Province != nil {
		car.Province = req.Province
	}
	if req.ConditionRating != nil {
		car.ConditionRating = req.ConditionRating
	}
	if req.BodyTypeID != nil {
		car.BodyTypeID = req.BodyTypeID
	}
	if req.TransmissionID != nil {
		car.TransmissionID = req.TransmissionID
	}
	if req.FuelTypeID != nil {
		car.FuelTypeID = req.FuelTypeID
	}
	if req.DrivetrainID != nil {
		car.DrivetrainID = req.DrivetrainID
	}
	if req.Seats != nil {
		car.Seats = req.Seats
	}
	if req.Doors != nil {
		car.Doors = req.Doors
	}
	if req.Color != nil {
		car.Color = req.Color
	}
	if req.Status != nil {
		car.Status = *req.Status
	}

	return s.carRepo.UpdateCar(car)
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

// GetCarImagesMetadata retrieves all image metadata for a car
func (s *CarService) GetCarImagesMetadata(carID int) ([]models.CarImageMetadata, error) {
	return s.imageRepo.GetCarImagesMetadata(carID)
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

// UpdateImageDisplayOrder updates the display order of an image
func (s *CarService) UpdateImageDisplayOrder(imageID, displayOrder, userID int, isAdmin bool) error {
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

	// Check authorization - only owner or admin can update
	if !isAdmin && car.SellerID != userID {
		return fmt.Errorf("unauthorized: you can only update your own car images")
	}

	return s.imageRepo.UpdateImageDisplayOrder(imageID, displayOrder)
}
