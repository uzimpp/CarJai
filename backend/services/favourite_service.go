package services

import (
	"fmt"

	"github.com/uzimpp/CarJai/backend/models"
)

// FavouriteService handles favourites-related business logic
type FavouriteService struct {
	favouriteRepo *models.FavouriteRepository
	carService    *CarService
}

func NewFavouriteService(favRepo *models.FavouriteRepository, carService *CarService) *FavouriteService {
	return &FavouriteService{
		favouriteRepo: favRepo,
		carService:    carService,
	}
}

// AddFavourite adds a car to a user's favourites
func (s *FavouriteService) AddFavourite(userID, carID int) error {
	// Ensure car exists and is active (buyers favourite active cars)
	car, err := s.carService.GetCarByID(carID)
	if err != nil {
		return err
	}
	if car.Status == "draft" {
		return fmt.Errorf("cannot favourite a draft car")
	}
	return s.favouriteRepo.AddFavourite(userID, carID)
}

// RemoveFavourite removes a car from a user's favourites
func (s *FavouriteService) RemoveFavourite(userID, carID int) error {
	return s.favouriteRepo.RemoveFavourite(userID, carID)
}

// GetFavouriteListings returns favourite cars as listings with images
func (s *FavouriteService) GetFavouriteListings(userID int) ([]models.CarListingWithImages, error) {
	ids, err := s.favouriteRepo.GetFavouriteCarIDsByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []models.CarListingWithImages{}, nil
	}

    // Build listings in the same shape used elsewhere
    var listings []models.CarListingWithImages
    for _, id := range ids {
        carWithImages, err := s.carService.GetCarWithImages(id)
        if err != nil {
            return nil, err
        }
        listing := models.CarListingWithImages{
            ID:               carWithImages.Car.ID,
            SellerID:         carWithImages.Car.SellerID,
            Year:             carWithImages.Car.Year,
            Mileage:          carWithImages.Car.Mileage,
            Price:            carWithImages.Car.Price,
            ProvinceID:       carWithImages.Car.ProvinceID,
            ConditionRating:  carWithImages.Car.ConditionRating,
            BodyTypeCode:     carWithImages.Car.BodyTypeCode,
            TransmissionCode: carWithImages.Car.TransmissionCode,
            DrivetrainCode:   carWithImages.Car.DrivetrainCode,
            Seats:            carWithImages.Car.Seats,
            Doors:            carWithImages.Car.Doors,
            Status:           carWithImages.Car.Status,
            CreatedAt:        carWithImages.Car.CreatedAt,
            UpdatedAt:        carWithImages.Car.UpdatedAt,
            BrandName:        carWithImages.Car.BrandName,
            ModelName:        carWithImages.Car.ModelName,
            SubmodelName:     carWithImages.Car.SubmodelName,
            Images:           carWithImages.Images,
        }
        listings = append(listings, listing)
    }

	return listings, nil
}