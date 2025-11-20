package services

import (
	"database/sql"
	"fmt"

	"github.com/uzimpp/CarJai/backend/models"
)

// RecentViewsService handles recent views business logic
type RecentViewsService struct {
	db         *sql.DB
	carService *CarService
}

// NewRecentViewsService creates a new recent views service
func NewRecentViewsService(db *sql.DB, carService *CarService) *RecentViewsService {
	return &RecentViewsService{
		db:         db,
		carService: carService,
	}
}

// RecordView records a car view for a user
func (s *RecentViewsService) RecordView(userID, carID int) error {
	// Check if car exists and is active
	var carExists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM cars WHERE id = $1 AND status = 'active')", carID).Scan(&carExists)
	if err != nil {
		return fmt.Errorf("failed to check car existence: %w", err)
	}
	if !carExists {
		return fmt.Errorf("car not found or not active")
	}

	// Update-first approach to avoid ON CONFLICT on expression index
	// If a view exists within the last minute, update its timestamp, otherwise insert a new row
	updateQuery := `
        UPDATE recent_views
        SET viewed_at = NOW()
        WHERE user_id = $1 AND car_id = $2 AND viewed_at >= NOW() - INTERVAL '1 minute'
    `
	result, err := s.db.Exec(updateQuery, userID, carID)
	if err != nil {
		return fmt.Errorf("failed to update recent view: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected for recent view update: %w", err)
	}

	if rowsAffected == 0 {
		insertQuery := `
            INSERT INTO recent_views (user_id, car_id, viewed_at)
            VALUES ($1, $2, NOW())
        `
		if _, err := s.db.Exec(insertQuery, userID, carID); err != nil {
			return fmt.Errorf("failed to insert recent view: %w", err)
		}
	}

	return nil
}

// GetUserRecentViews retrieves a user's recent car views as CarListItem objects
// Returns complete CarListItem objects with all translated labels and thumbnail URLs
func (s *RecentViewsService) GetUserRecentViews(userID, limit int, lang string) ([]models.CarListItem, error) {
	if lang == "" {
		lang = "en"
	}

	// Get recent view car IDs ordered by most recent viewed_at per car
	query := `
		SELECT car_id
		FROM (
			SELECT car_id, MAX(viewed_at) as max_viewed_at
			FROM recent_views
			WHERE user_id = $1
			GROUP BY car_id
			ORDER BY max_viewed_at DESC
			LIMIT $2
		) AS recent_cars
	`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent view car IDs: %w", err)
	}
	defer rows.Close()

	var carIDs []int
	for rows.Next() {
		var carID int
		if err := rows.Scan(&carID); err != nil {
			return nil, fmt.Errorf("failed to scan car ID: %w", err)
		}
		carIDs = append(carIDs, carID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating recent view car IDs: %w", err)
	}

	if len(carIDs) == 0 {
		return []models.CarListItem{}, nil
	}

	// Use CarService to get full CarListItem objects with batch translation
	return s.carService.GetCarListItemsByIDs(carIDs, lang)
}

// DeleteOldViews removes viewing history older than the specified number of days
func (s *RecentViewsService) DeleteOldViews(daysOld int) (int, error) {
	query := `DELETE FROM recent_views WHERE viewed_at < NOW() - INTERVAL '%d days'`
	result, err := s.db.Exec(fmt.Sprintf(query, daysOld))
	if err != nil {
		return 0, fmt.Errorf("failed to delete old views: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return int(rowsAffected), nil
}
