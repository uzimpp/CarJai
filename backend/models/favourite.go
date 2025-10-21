package models

import (
	"database/sql"
	"fmt"
	"time"
)

// Favourite represents a saved car by a user
type Favourite struct {
	FID       int       `json:"fid" db:"fid"`
	UserID    int       `json:"userId" db:"user_id"`
	CarID     int       `json:"carId" db:"car_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// FavouriteRepository handles favourites-related database operations
type FavouriteRepository struct {
	db *Database
}

// NewFavouriteRepository creates a new favourites repository
func NewFavouriteRepository(db *Database) *FavouriteRepository {
	return &FavouriteRepository{db: db}
}

// AddFavourite adds a favourite car for a user. If it already exists, it's a no-op.
func (r *FavouriteRepository) AddFavourite(userID, carID int) error {
	query := `
		INSERT INTO favourites (user_id, car_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, car_id) DO NOTHING`

	_, err := r.db.DB.Exec(query, userID, carID)
	if err != nil {
		return fmt.Errorf("failed to add favourite: %w", err)
	}
	return nil
}

// RemoveFavourite removes a favourite car for a user.
func (r *FavouriteRepository) RemoveFavourite(userID, carID int) error {
	query := `DELETE FROM favourites WHERE user_id = $1 AND car_id = $2`
	res, err := r.db.DB.Exec(query, userID, carID)
	if err != nil {
		return fmt.Errorf("failed to remove favourite: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// GetFavouriteCarIDsByUserID returns favourite car IDs for a user ordered by newest first.
func (r *FavouriteRepository) GetFavouriteCarIDsByUserID(userID int) ([]int, error) {
	query := `
		SELECT car_id
		FROM favourites
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get favourites: %w", err)
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan favourite car_id: %w", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating favourites: %w", err)
	}
	return ids, nil
}