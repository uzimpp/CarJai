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

// GetFavouriteListItems retrieves favorite cars as lightweight list items (always translated for display)
func (s *FavouriteService) GetFavouriteListItems(userID int, lang string) ([]models.CarListItem, error) {
	if lang == "" {
		lang = "en"
	}

	ids, err := s.favouriteRepo.GetFavouriteCarIDsByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []models.CarListItem{}, nil
	}

	// Directly fetch CarListItem objects by favorite car IDs using batch method
	return s.carService.GetCarListItemsByIDs(ids, lang)
}
