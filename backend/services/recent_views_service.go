package services

import (
	"database/sql"
	"fmt"

	"github.com/uzimpp/CarJai/backend/models"
)

// RecentViewsService handles recent views business logic
type RecentViewsService struct {
	db *sql.DB
}

// NewRecentViewsService creates a new recent views service
func NewRecentViewsService(db *sql.DB) *RecentViewsService {
	return &RecentViewsService{
		db: db,
	}
}

// RecordView records a car view for a user
func (s *RecentViewsService) RecordView(userID, carID int) error {
	// Check if car exists and is active
	var carExists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM cars WHERE cid = $1 AND status = 'active')", carID).Scan(&carExists)
	if err != nil {
		return fmt.Errorf("failed to check car existence: %w", err)
	}
	if !carExists {
		return fmt.Errorf("car not found or not active")
	}

	// Insert or update recent view (ON CONFLICT DO UPDATE to handle the unique constraint)
	query := `
		INSERT INTO recent_views (user_id, car_id, viewed_at) 
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id, car_id, DATE_TRUNC('minute', viewed_at))
		DO UPDATE SET viewed_at = NOW()
	`
	
	_, err = s.db.Exec(query, userID, carID)
	if err != nil {
		return fmt.Errorf("failed to record view: %w", err)
	}

	return nil
}

// GetUserRecentViews retrieves a user's recent car views with car details
func (s *RecentViewsService) GetUserRecentViews(userID, limit int) ([]models.RecentViewWithCarDetails, error) {
	query := `
		SELECT 
			rv.rvid,
			rv.user_id,
			rv.car_id,
			rv.viewed_at,
			c.year,
			c.mileage,
			c.price,
			c.province,
			c.condition_rating,
			c.color,
			c.status,
			cd.brand_name,
			cd.model_name,
			s.display_name as seller_display_name
		FROM recent_views rv
		JOIN cars c ON rv.car_id = c.cid
		LEFT JOIN car_details cd ON c.cid = cd.car_id
		JOIN sellers s ON c.seller_id = s.id
		WHERE rv.user_id = $1
		ORDER BY rv.viewed_at DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query recent views: %w", err)
	}
	defer rows.Close()

	var recentViews []models.RecentViewWithCarDetails
	for rows.Next() {
		var rv models.RecentViewWithCarDetails
		err := rows.Scan(
			&rv.RVID,
			&rv.UserID,
			&rv.CarID,
			&rv.ViewedAt,
			&rv.Year,
			&rv.Mileage,
			&rv.Price,
			&rv.Province,
			&rv.ConditionRating,
			&rv.Color,
			&rv.Status,
			&rv.BrandName,
			&rv.ModelName,
			&rv.SellerDisplayName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recent view: %w", err)
		}
		recentViews = append(recentViews, rv)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating recent views: %w", err)
	}

	return recentViews, nil
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