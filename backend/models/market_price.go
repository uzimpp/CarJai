// models/market_price.go
package models

import (
	"database/sql"
	"fmt"
)

// MarketPrice represents a row in the market_price table
type MarketPrice struct {
	ID          int    `json:"id" db:"id"`
	Brand       string `json:"brand" db:"brand"`
	ModelTrim   string `json:"modelTrim" db:"model_trim"`
	YearStart   int    `json:"yearStart" db:"year_start"`
	YearEnd     int    `json:"yearEnd" db:"year_end"`
	PriceMinTHB int64  `json:"priceMinThb" db:"price_min_thb"`
	PriceMaxTHB int64  `json:"priceMaxThb" db:"price_max_thb"`
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
// We assume model_trim in market_price maps to model_name in cars
func (r *MarketPriceRepository) GetMarketPrice(brand, model string, year int) (*MarketPrice, error) {
	mp := &MarketPrice{}
	query := `
		SELECT price_min_thb, price_max_thb
		FROM market_price
		WHERE
			brand ILIKE $1 AND
			model_trim ILIKE $2 AND
			$3 BETWEEN year_start AND year_end
		LIMIT 1`

	err := r.db.DB.QueryRow(query, brand, model, year).Scan(&mp.PriceMinTHB, &mp.PriceMaxTHB)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("market price not found for %s %s (%d)", brand, model, year)
		}
		return nil, fmt.Errorf("failed to get market price: %w", err)
	}

	return mp, nil
}