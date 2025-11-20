package services

import (
	"fmt"

	"github.com/uzimpp/CarJai/backend/models"
)

// CarTranslator handles translation of car data to display-ready formats
// This extracts common translation logic for reusability
type CarTranslator struct {
	carRepo   *models.CarRepository
	imageRepo *models.CarImageRepository
	fuelRepo  *models.CarFuelRepository
	colorRepo *models.CarColorRepository
}

// NewCarTranslator creates a new car translator
func NewCarTranslator(
	carRepo *models.CarRepository,
	imageRepo *models.CarImageRepository,
	fuelRepo *models.CarFuelRepository,
	colorRepo *models.CarColorRepository,
) *CarTranslator {
	return &CarTranslator{
		carRepo:   carRepo,
		imageRepo: imageRepo,
		fuelRepo:  fuelRepo,
		colorRepo: colorRepo,
	}
}

// GetThumbnailURL extracts the thumbnail URL from a list of images
// Returns the image with display_order = 0, or the one with lowest order if 0 doesn't exist
func (t *CarTranslator) GetThumbnailURL(images []models.CarImageMetadata) *string {
	if len(images) == 0 {
		return nil
	}

	// Find image with display order = 0, or lowest order if 0 doesn't exist
	var thumbnailImage *models.CarImageMetadata
	for i := range images {
		if images[i].DisplayOrder == 0 {
			thumbnailImage = &images[i]
			break
		}
	}

	// If no image with order 0, use the one with lowest order
	if thumbnailImage == nil {
		thumbnailImage = &images[0]
		for i := range images {
			if images[i].DisplayOrder < thumbnailImage.DisplayOrder {
				thumbnailImage = &images[i]
			}
		}
	}

	thumbnailURL := fmt.Sprintf("/api/cars/images/%d", thumbnailImage.ID)
	return &thumbnailURL
}

// TranslateCarToListItem converts a single car to CarListItem using provided batch data
// This is used by batch translation methods to avoid redundant lookups
func (t *CarTranslator) TranslateCarToListItem(
	car *models.Car,
	lang string,
	images []models.CarImageMetadata,
	fuelCodes []string,
	colorCodes []string,
	bodyTypeLabels map[string]string,
	transmissionLabels map[string]string,
	drivetrainLabels map[string]string,
	fuelLabelsMap map[string]string,
	colorLabelsMap map[string]string,
) (models.CarListItem, error) {
	item := models.CarListItem{
		ID:              car.ID,
		SellerID:        car.SellerID,
		Status:          car.Status,
		BrandName:       car.BrandName,
		ModelName:       car.ModelName,
		SubmodelName:    car.SubmodelName,
		Year:            car.Year,
		Price:           car.Price,
		Mileage:         car.Mileage,
		ConditionRating: car.ConditionRating,
		// Initialize slices to avoid null in JSON
		FuelTypes: []string{},
		Colors:    []string{},
	}

	// Set body type label from batch map
	if car.BodyTypeCode != nil && *car.BodyTypeCode != "" {
		if label, ok := bodyTypeLabels[*car.BodyTypeCode]; ok && label != "" {
			item.BodyType = &label
		}
	}

	// Set transmission label from batch map
	if car.TransmissionCode != nil && *car.TransmissionCode != "" {
		if label, ok := transmissionLabels[*car.TransmissionCode]; ok && label != "" {
			item.Transmission = &label
		}
	}

	// Set drivetrain label from batch map
	if car.DrivetrainCode != nil && *car.DrivetrainCode != "" {
		if label, ok := drivetrainLabels[*car.DrivetrainCode]; ok && label != "" {
			item.Drivetrain = &label
		}
	}

	// Set fuel types from batch map
	for _, code := range fuelCodes {
		if label, ok := fuelLabelsMap[code]; ok && label != "" {
			item.FuelTypes = append(item.FuelTypes, label)
		}
	}

	// Set colors from batch map
	for _, code := range colorCodes {
		if label, ok := colorLabelsMap[code]; ok && label != "" {
			item.Colors = append(item.Colors, label)
		}
	}

	// Set thumbnail URL
	item.ThumbnailURL = t.GetThumbnailURL(images)

	return item, nil
}
