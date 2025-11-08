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
            p.name_en as province,
            c.condition_rating,
            col.label_en as color,
            c.status,
            c.brand_name,
            c.model_name,
            s.display_name as seller_display_name
        FROM recent_views rv
        JOIN cars c ON rv.car_id = c.id
        LEFT JOIN provinces p ON c.province_id = p.id
        LEFT JOIN car_colors cc ON cc.car_id = c.id AND cc.position = 0
        LEFT JOIN colors col ON cc.color_code = col.code
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
		var yearNull, mileageNull, priceNull, conditionRatingNull sql.NullInt64
		err := rows.Scan(
			&rv.RVID,
			&rv.UserID,
			&rv.CarID,
			&rv.ViewedAt,
			&yearNull,
			&mileageNull,
			&priceNull,
			&rv.Province,
			&conditionRatingNull,
			&rv.Color,
			&rv.Status,
			&rv.BrandName,
			&rv.ModelName,
			&rv.SellerDisplayName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recent view: %w", err)
		}
		// Convert sql.NullInt64 to *int
		if yearNull.Valid {
			year := int(yearNull.Int64)
			rv.Year = &year
		}
		if mileageNull.Valid {
			mileage := int(mileageNull.Int64)
			rv.Mileage = &mileage
		}
		if priceNull.Valid {
			price := int(priceNull.Int64)
			rv.Price = &price
		}
		if conditionRatingNull.Valid {
			conditionRating := int(conditionRatingNull.Int64)
			rv.ConditionRating = &conditionRating
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