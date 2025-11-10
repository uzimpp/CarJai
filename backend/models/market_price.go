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

func (r *MarketPriceRepository) GetDistinctBrands() ([]string, error) {
	query := `SELECT DISTINCT brand FROM market_price ORDER BY brand;`

	rows, err := r.db.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query distinct brands: %w", err)
	}
	defer rows.Close()

	var brands []string
	for rows.Next() {
		var brand string
		if err := rows.Scan(&brand); err != nil {
			return nil, fmt.Errorf("failed to scan brand: %w", err)
		}
		brands = append(brands, brand)
	}
	return brands, nil
}

func (r *MarketPriceRepository) GetDistinctModels(brand string) ([]string, error) {
	query := `SELECT DISTINCT model FROM market_price WHERE brand = $1 ORDER BY model;`

	rows, err := r.db.DB.Query(query, brand)
	if err != nil {
		return nil, fmt.Errorf("failed to query distinct models: %w", err)
	}
	defer rows.Close()

	var models []string
	for rows.Next() {
		var model string
		if err := rows.Scan(&model); err != nil {
			return nil, fmt.Errorf("failed to scan model: %w", err)
		}
		models = append(models, model)
	}
	return models, nil
}

func (r *MarketPriceRepository) GetDistinctSubModels(brand string, model string) ([]string, error) {
	query := `SELECT DISTINCT sub_model FROM market_price WHERE brand = $1 AND model = $2 ORDER BY sub_model;`

	rows, err := r.db.DB.Query(query, brand, model)
	if err != nil {
		return nil, fmt.Errorf("failed to query distinct sub_models: %w", err)
	}
	defer rows.Close()

	var subModels []string
	for rows.Next() {
		var subModel string
		if err := rows.Scan(&subModel); err != nil {
			return nil, fmt.Errorf("failed to scan sub_model: %w", err)
		}
		subModels = append(subModels, subModel)
	}
	return subModels, nil
}
