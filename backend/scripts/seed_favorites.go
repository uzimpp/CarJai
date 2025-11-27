package main

import (
	"database/sql"
	"fmt"
	"log"
)

const (
	MIN_FAVORITES_PER_USER = 2
	MAX_FAVORITES_PER_USER = 8
)

// seedFavoritesData seeds favorites (buyers favoriting cars)
func seedFavoritesData(db *sql.DB) error {
	// Get existing buyers (only buyers can favorite cars)
	buyers, err := getBuyers(db)
	if err != nil {
		return fmt.Errorf("failed to get buyers: %w", err)
	}
	if len(buyers) == 0 {
		return fmt.Errorf("no buyers found - seed users first")
	}
	log.Printf("✓ Found %d buyers", len(buyers))

	// Get existing cars
	cars, err := getCars(db)
	if err != nil {
		return fmt.Errorf("failed to get cars: %w", err)
	}
	if len(cars) == 0 {
		return fmt.Errorf("no cars found - seed cars first")
	}
	log.Printf("✓ Found %d cars", len(cars))

	totalFavorites := 0

	// For each buyer, create random favorites
	for _, buyerID := range buyers {
		// Random number of favorites per user
		numFavorites := randomInt(MIN_FAVORITES_PER_USER, MAX_FAVORITES_PER_USER)
		if numFavorites > len(cars) {
			numFavorites = len(cars)
		}

		// Select random cars for this buyer
		selectedCars := randomItems(cars, numFavorites)

		for _, carID := range selectedCars {
			// Random created_at within last 30 days
			createdAt := randomTimeInRange(30)

			// Insert favorite (ignore if already exists due to primary key constraint)
			_, err := db.Exec(`
				INSERT INTO favourites (user_id, car_id, created_at)
				VALUES ($1, $2, $3)
				ON CONFLICT (user_id, car_id) DO NOTHING
			`, buyerID, carID, createdAt)
			if err != nil {
				log.Printf("✗ Failed to create favorite (buyer %d, car %d): %v", buyerID, carID, err)
				continue
			}
			totalFavorites++
		}
	}

	log.Printf("Total Favorites created: %d", totalFavorites)
	return nil
}
