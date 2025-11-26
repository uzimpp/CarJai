package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

const (
	MIN_VIEWS_PER_USER = 2
	MAX_VIEWS_PER_USER = 8
)

// seedRecentViewsData seeds recent views (buyers viewing cars)
func seedRecentViewsData(db *sql.DB) error {
	// Get existing buyers (only buyers view cars)
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

	totalViews := 0

	// For each buyer, create random views
	for _, buyerID := range buyers {
		// Random number of views per user
		numViews := randomInt(MIN_VIEWS_PER_USER, MAX_VIEWS_PER_USER)
		if numViews > len(cars) {
			numViews = len(cars)
		}

		// Select random cars for this user
		selectedCars := randomItems(cars, numViews)

		for _, carID := range selectedCars {
			// Create multiple views for the same car (spread over time)
			// Each user can view the same car multiple times (different minutes)
			numViewsForCar := randomInt(1, 3) // 1-3 views per car

			for i := 0; i < numViewsForCar; i++ {
				// Random viewed_at within last 30 days, but ensure different minutes
				viewedAt := randomTimeInRange(30)
				// Add random minutes to ensure different timestamps (respecting unique constraint)
				viewedAt = viewedAt.Add(time.Minute * time.Duration(i*randomInt(1, 60)))

				// Insert view (ignore if conflict due to unique constraint on (user_id, car_id, DATE_TRUNC('minute', viewed_at)))
				_, err := db.Exec(`
					INSERT INTO recent_views (user_id, car_id, viewed_at)
					VALUES ($1, $2, $3)
					ON CONFLICT (user_id, car_id, DATE_TRUNC('minute', viewed_at)) DO NOTHING
				`, buyerID, carID, viewedAt)
				if err != nil {
					log.Printf("✗ Failed to create recent view (buyer %d, car %d): %v", buyerID, carID, err)
					continue
				}
				totalViews++
			}
		}
	}

	log.Printf("Total Recent Views created: %d", totalViews)
	return nil
}
