// models/market_price.go
package models

import (
	"database/sql"
	"fmt"
	"time" 
)

// MarketPrice represents a row in the market_price table
type MarketPrice struct {
	ID          int       `json:"id" db:"id"`
	Brand       string    `json:"brand" db:"brand"`
	Model       string    `json:"model" db:"model"`      
	SubModel    string    `json:"sub_model" db:"sub_model"` 
	YearStart   int       `json:"year_start" db:"year_start"`
	YearEnd     int       `json:"year_end" db:"year_end"`
	PriceMinTHB int64     `json:"price_min_thb" db:"price_min_thb"`
	PriceMaxTHB int64     `json:"price_max_thb" db:"price_max_thb"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// MarketPriceRepository handles market_price table operations
type MarketPriceRepository struct {
	db *Database
}

// NewMarketPriceRepository creates a new market price repository
func NewMarketPriceRepository(db *Database) *MarketPriceRepository {
	return &MarketPriceRepository{db: db}
}

// GetMarketPrice finds the average market price for a given brand, model, and year
func (r *MarketPriceRepository) GetMarketPrice(brand string, model string, submodel string, year int) (*MarketPrice, error) {
	mp := &MarketPrice{}

	query := `
		SELECT 
			id, brand, model, sub_model, 
			year_start, year_end, 
			price_min_thb, price_max_thb, 
			created_at, updated_at
		FROM market_price
		WHERE
			brand ILIKE $1 AND
			model ILIKE $2 AND
			sub_model ILIKE $3 AND 
			$4 BETWEEN year_start AND year_end
		LIMIT 1`

	err := r.db.DB.QueryRow(query, brand, model, submodel, year).Scan(
		&mp.ID, &mp.Brand, &mp.Model, &mp.SubModel,
		&mp.YearStart, &mp.YearEnd,
		&mp.PriceMinTHB, &mp.PriceMaxTHB,
		&mp.CreatedAt, &mp.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("market price not found for %s %s %s (%d)", brand, model, submodel, year)
		}
		return nil, fmt.Errorf("failed to get market price: %w", err)
	}

	return mp, nil
}