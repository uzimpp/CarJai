package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Car represents a car listing
type Car struct {
	ID               int       `json:"id" db:"id"`
	SellerID         int       `json:"sellerId" db:"seller_id"`
	BodyTypeCode     *string   `json:"bodyTypeCode" db:"body_type_code"`        // e.g., "PICKUP", "SUV"
	TransmissionCode *string   `json:"transmissionCode" db:"transmission_code"` // e.g., "MANUAL", "AT"
	DrivetrainCode   *string   `json:"drivetrainCode" db:"drivetrain_code"`     // e.g., "FWD", "AWD"
	BrandName        *string   `json:"brandName" db:"brand_name"`
	ModelName        *string   `json:"modelName" db:"model_name"`
	SubmodelName     *string   `json:"submodelName" db:"submodel_name"`
	ChassisNumber    *string   `json:"chassisNumber" db:"chassis_number"` // Nullable for drafts; required at publish
	Year             *int      `json:"year" db:"year"`
	Mileage          *int      `json:"mileage" db:"mileage"`
	EngineCC         *int      `json:"engineCc" db:"engine_cc"` // Engine displacement in cc (rounded to int)
	Seats            *int      `json:"seats" db:"seats"`
	Doors            *int      `json:"doors" db:"doors"`
	Prefix           *string   `json:"prefix" db:"prefix"`          // Nullable for drafts
	Number           *string   `json:"number" db:"number"`          // Nullable for drafts
	ProvinceID       *int      `json:"provinceId" db:"province_id"` // Nullable for drafts
	Description      *string   `json:"description" db:"description"`
	Price            *int      `json:"price" db:"price"` // Nullable for drafts
	IsFlooded        bool      `json:"isFlooded" db:"is_flooded"`
	IsHeavilyDamaged bool      `json:"isHeavilyDamaged" db:"is_heavily_damaged"`
	Status           string    `json:"status" db:"status"`
	ConditionRating  *int      `json:"conditionRating" db:"condition_rating"`
	CreatedAt        time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CarImage represents an image stored in the database
type CarImage struct {
	ID           int       `json:"id" db:"id"`
	CarID        int       `json:"carId" db:"car_id"`
	ImageData    []byte    `json:"-" db:"image_data"`
	ImageType    string    `json:"imageType" db:"image_type"`
	ImageSize    int       `json:"imageSize" db:"image_size"`
	DisplayOrder int       `json:"displayOrder" db:"display_order"`
	UploadedAt   time.Time `json:"uploadedAt" db:"uploaded_at"`
}

// CarImageMetadata represents image metadata without the actual image data
type CarImageMetadata struct {
	ID           int       `json:"id" db:"id"`
	CarID        int       `json:"carId" db:"car_id"`
	ImageType    string    `json:"imageType" db:"image_type"`
	ImageSize    int       `json:"imageSize" db:"image_size"`
	DisplayOrder int       `json:"displayOrder" db:"display_order"`
	UploadedAt   time.Time `json:"uploadedAt" db:"uploaded_at"`
}

// Reference tables models
type BodyType struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type Transmission struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type FuelType struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type Drivetrain struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// BrandDataPoint (used for charts)
type BrandDataPoint struct {
	Brand string `json:"brand" db:"brand"`
	Count int    `json:"count" db:"count"`
}

// Request and Response models
// Note: CreateCarRequest removed - POST /api/cars doesn't need a request body
// It just creates an empty draft based on authenticated seller ID

type UpdateCarRequest struct {
	BodyTypeCode     *string  `json:"bodyTypeCode"`     // e.g., "PICKUP", "SUV"
	TransmissionCode *string  `json:"transmissionCode"` // e.g., "MANUAL", "AT"
	DrivetrainCode   *string  `json:"drivetrainCode"`   // e.g., "FWD", "AWD"
	BrandName        *string  `json:"brandName"`
	ModelName        *string  `json:"modelName"`
	SubmodelName     *string  `json:"submodelName"`
	ChassisNumber    *string  `json:"chassisNumber"` // Should not be updated normally
	Year             *int     `json:"year"`
	Mileage          *int     `json:"mileage"`
	EngineCC         *int     `json:"engineCc"`
	Seats            *int     `json:"seats"`
	Doors            *int     `json:"doors"`
	Prefix           *string  `json:"prefix"`
	Number           *string  `json:"number"`
	ProvinceID       *int     `json:"provinceId"`
	Description      *string  `json:"description"`
	Price            *int     `json:"price" validate:"omitempty,gt=0"`
	IsFlooded        *bool    `json:"isFlooded"`
	IsHeavilyDamaged *bool    `json:"isHeavilyDamaged"`
	ConditionRating  *int     `json:"conditionRating" validate:"omitempty,gte=1,lte=5"`
	Status           *string  `json:"status" validate:"omitempty,oneof=draft active sold deleted"`
	FuelCodes        []string `json:"fuelCodes,omitempty"`

	// Text fields for frontend submission (backend maps to codes)
	ProvinceNameTh   *string  `json:"provinceNameTh"`
	BodyTypeName     *string  `json:"bodyTypeName"`     // Maps to body_type_code
	TransmissionName *string  `json:"transmissionName"` // Maps to transmission_code
	DrivetrainName   *string  `json:"drivetrainName"`   // Maps to drivetrain_code
	FuelLabels       []string `json:"fuelLabels"`       // Maps to fuel_codes, e.g., ["เบนซิน", "LPG"]
}

// AdminManagedCar represents car data for the admin management table
type AdminManagedCar struct {
	ID           int       `json:"id" db:"id"`
	BrandName    *string   `json:"brandName" db:"brand_name"`
	ModelName    *string   `json:"modelName" db:"model_name"`
	SubmodelName *string   `json:"submodelName" db:"submodel_name"`
	Year         *int      `json:"year" db:"year"` 
	Status       string    `json:"status" db:"status"`
	CreatedAt    time.Time `json:"listedDate" db:"created_at"`
	SellerName   *string   `json:"soldBy" db:"seller_name"`
	Price        *int      `json:"price" db:"price"`
	Mileage      *int      `json:"mileage" db:"mileage"`
}

// AdminUpdateCarRequest defines the fields updatable by an admin
type AdminUpdateCarRequest struct {
	BrandName    *string `json:"brandName,omitempty"`
	ModelName    *string `json:"modelName,omitempty"`
	SubmodelName *string `json:"submodelName,omitempty"`
	Year         *int    `json:"year,omitempty"`
	Price        *int    `json:"price,omitempty"`
	Mileage      *int    `json:"mileage,omitempty"`
	Status       *string `json:"status,omitempty"`
}

// AdminCreateCarRequest defines the fields for creating a car by admin
type AdminCreateCarRequest struct {
	SellerID     int     `json:"sellerId" validate:"required"`
	BrandName    *string `json:"brandName,omitempty"`
	ModelName    *string `json:"modelName,omitempty"`
	SubmodelName *string `json:"submodelName,omitempty"`
	Year         *int    `json:"year,omitempty"`
	Price        *int    `json:"price,omitempty"`
	Mileage      *int    `json:"mileage,omitempty"`
	Status       *string `json:"status,omitempty"`
}

// AdminCarsListResponse is the response for GET /admin/cars
type AdminCarsListResponse struct {
	Success bool              `json:"success"`
	Data    []AdminManagedCar `json:"data"`
	Total   int               `json:"total"`
}

// StepState models readiness of a step with issues
type StepState struct {
	Ready  bool     `json:"ready"`
	Issues []string `json:"issues"`
}

// StepStatus aggregates step states for PATCH response
type StepStatus struct {
	Step2 StepState `json:"step2"`
	Step3 StepState `json:"step3"`
}

// ReorderImagesRequest for PUT /api/cars/{id}/images/order
type ReorderImagesRequest struct {
	ImageIDs []int `json:"imageIds" validate:"required,min=5,max=12"` // 5-12 images in order
}

// UploadInspectionRequest for POST /api/cars/{id}/inspection
type UploadInspectionRequest struct {
	URL *string `json:"url"` // Either URL or file upload
}

// ReviewResponse for GET /api/cars/{id}/review
type ReviewResponse struct {
	Ready  bool     `json:"ready"`
	Issues []string `json:"issues"`
}

type CarResponse struct {
	Success bool   `json:"success"`
	Data    Car    `json:"data"`
	Message string `json:"message,omitempty"`
}

// (Removed unused CarListResponse and PaginatedCarListResponse)

type PaginatedCarListingResponse struct {
	Success bool                    `json:"success"`
	Data    PaginatedCarListingData `json:"data"`
	Message string                  `json:"message,omitempty"`
}

type PaginatedCarListingData struct {
	Cars  []CarListingWithImages `json:"cars"`
	Total int                    `json:"total"`
	Page  int                    `json:"page"`
	Limit int                    `json:"limit"`
}

type CarWithImagesResponse struct {
	Success bool          `json:"success"`
	Data    CarWithImages `json:"data"`
	Message string        `json:"message,omitempty"`
}

type CarWithImages struct {
	Car        Car                `json:"car"`
	Images     []CarImageMetadata `json:"images"`
	Inspection *InspectionResult  `json:"inspection"` // Always include, even if null
}

type CarListingWithImages struct {
	ID               int                `json:"id"`
	SellerID         int                `json:"sellerId"`
	Year             *int               `json:"year"`
	Mileage          *int               `json:"mileage"`
	Price            *int               `json:"price"`      // Nullable for drafts
	ProvinceID       *int               `json:"provinceId"` // Nullable for drafts
	ConditionRating  *int               `json:"conditionRating"`
	BodyTypeCode     *string            `json:"bodyTypeCode"`     // Changed from BodyTypeID
	TransmissionCode *string            `json:"transmissionCode"` // Changed from TransmissionID
	DrivetrainCode   *string            `json:"drivetrainCode"`   // Changed from DrivetrainID
	Seats            *int               `json:"seats"`
	Doors            *int               `json:"doors"`
	Status           string             `json:"status"`
	CreatedAt        time.Time          `json:"createdAt"`
	UpdatedAt        time.Time          `json:"updatedAt"`
	BrandName        *string            `json:"brandName"`
	ModelName        *string            `json:"modelName"`
	SubmodelName     *string            `json:"submodelName"`
	Images           []CarImageMetadata `json:"images"`
}

type CarWithImagesListResponse struct {
	Success bool            `json:"success"`
	Data    []CarWithImages `json:"data"`
	Message string          `json:"message,omitempty"`
}

type CarListingWithImagesResponse struct {
	Success bool                   `json:"success"`
	Data    []CarListingWithImages `json:"data"`
	Message string                 `json:"message,omitempty"`
}

type ImageUploadResponse struct {
	Success bool            `json:"success"`
	Data    ImageUploadData `json:"data"`
	Message string          `json:"message,omitempty"`
}

type ImageUploadData struct {
	CarID         int                `json:"carId"`
	UploadedCount int                `json:"uploadedCount"`
	Images        []CarImageMetadata `json:"images"`
}

// CarRepository handles car-related database operations
type CarRepository struct {
	db *Database
}

// NewCarRepository creates a new car repository
func NewCarRepository(db *Database) *CarRepository {
	return &CarRepository{db: db}
}

// CreateCar creates a new car listing (allows nullable fields for drafts)
func (r *CarRepository) CreateCar(car *Car) error {
	query := `
		INSERT INTO cars (
			seller_id, body_type_code, transmission_code, drivetrain_code,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats,
			doors, prefix, number, province_id, 
			description, price, is_flooded, is_heavily_damaged,
			status, condition_rating
		) VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8,
			$9, $10, $11, $12,
			$13, $14, $15, $16,
			$17, $18, $19, $20,
			$21, $22
		)
		RETURNING id, created_at, updated_at`

	err := r.db.DB.QueryRow(query,
		car.SellerID, car.BodyTypeCode, car.TransmissionCode, car.DrivetrainCode,
		car.BrandName, car.ModelName, car.SubmodelName, car.ChassisNumber,
		car.Year, car.Mileage, car.EngineCC, car.Seats, car.Doors,
		car.Prefix, car.Number, car.ProvinceID, car.Description, car.Price,
		car.IsFlooded, car.IsHeavilyDamaged, car.Status, car.ConditionRating,
	).Scan(&car.ID, &car.CreatedAt, &car.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create car: %w", err)
	}

	return nil
}

// GetCarByID retrieves a car by ID
func (r *CarRepository) GetCarByID(carID int) (*Car, error) {
	car := &Car{}
	query := `
		SELECT id, seller_id, body_type_code, transmission_code, drivetrain_code,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats, doors,
			prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged,
			status, condition_rating, created_at, updated_at
		FROM cars
		WHERE id = $1`

	err := r.db.DB.QueryRow(query, carID).Scan(
		&car.ID, &car.SellerID, &car.BodyTypeCode, &car.TransmissionCode, &car.DrivetrainCode,
		&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
		&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
		&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
		&car.IsFlooded, &car.IsHeavilyDamaged, &car.Status,
		&car.ConditionRating, &car.CreatedAt, &car.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("car not found")
		}
		return nil, fmt.Errorf("failed to get car: %w", err)
	}

	return car, nil
}

// GetManagedCars retrieves all cars with seller names for the admin panel
func (r *CarRepository) GetManagedCars() (*[]AdminManagedCar, error) {
	var cars []AdminManagedCar
	query := `
		SELECT
			c.id,
			c.brand_name,
			c.model_name,
			c.submodel_name,
			c.year,          
			c.status,
			c.created_at,
			u.name AS seller_name,
			c.price,
			c.mileage
		FROM
			cars c
		LEFT JOIN
			users u ON c.seller_id = u.id
		ORDER BY
			c.created_at DESC
	`

	rows, err := r.db.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error querying managed cars: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var car AdminManagedCar
		err := rows.Scan(
			&car.ID,
			&car.BrandName,
			&car.ModelName,
			&car.SubmodelName,
			&car.Year,         
			&car.Status,
			&car.CreatedAt,
			&car.SellerName,
			&car.Price,
			&car.Mileage,
		)
		
		if err != nil {
			return nil, fmt.Errorf("failed to scan managed car: %w", err)
		}
		cars = append(cars, car)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating managed cars: %w", err)
	}

	return &cars, nil
}

// GetTopBrandsByCount retrieves the top 10 brands by car count
func (r *CarRepository) GetTopBrandsByCount() ([]BrandDataPoint, error) {
	var results []BrandDataPoint
	
	query := `
		SELECT
			brand_name AS brand,
			COUNT(id) AS count
		FROM
			cars
		WHERE
			status = 'active' AND brand_name IS NOT NULL AND brand_name != ''
		GROUP BY
			brand_name
		ORDER BY
			count DESC
		LIMIT 10;
	`

	rows, err := r.db.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query top brands: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var point BrandDataPoint
		if err := rows.Scan(&point.Brand, &point.Count); err != nil {
			return nil, fmt.Errorf("failed to scan top brand data point: %w", err)
		}
		results = append(results, point)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating top brands: %w", err)
	}

	return results, nil
}

// UpdateCarByAdmin updates a car's details from the admin panel
func (r *CarRepository) UpdateCarByAdmin(carID int, req AdminUpdateCarRequest) (*Car, error) {
	// Build dynamic query
	query := "UPDATE cars SET "
	args := []interface{}{}
	argNum := 1
	updates := []string{}

	if req.BrandName != nil {
		updates = append(updates, fmt.Sprintf("brand_name = $%d", argNum))
		args = append(args, *req.BrandName)
		argNum++
	}
	if req.ModelName != nil {
		updates = append(updates, fmt.Sprintf("model_name = $%d", argNum))
		args = append(args, *req.ModelName)
		argNum++
	}
	if req.SubmodelName != nil {
		updates = append(updates, fmt.Sprintf("submodel_name = $%d", argNum))
		args = append(args, *req.SubmodelName)
		argNum++
	}
	if req.Year != nil {
		updates = append(updates, fmt.Sprintf("year = $%d", argNum))
		args = append(args, *req.Year)
		argNum++
	}
	if req.Price != nil {
		updates = append(updates, fmt.Sprintf("price = $%d", argNum))
		args = append(args, *req.Price)
		argNum++
	}
	if req.Mileage != nil {
		updates = append(updates, fmt.Sprintf("mileage = $%d", argNum))
		args = append(args, *req.Mileage)
		argNum++
	}
	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argNum))
		args = append(args, *req.Status)
		argNum++
	}

	if len(updates) == 0 {
		return r.GetCarByID(carID)
	}

	updates = append(updates, fmt.Sprintf("updated_at = $%d", argNum))
	args = append(args, time.Now())
	argNum++

	query += strings.Join(updates, ", ")
	query += fmt.Sprintf(" WHERE id = $%d", argNum)
	args = append(args, carID)

	// Execute query
	result, err := r.db.DB.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute admin car update: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return nil, fmt.Errorf("car not found")
	}

	return r.GetCarByID(carID)
}

// CreateCarByAdmin creates a new car listing associated with a seller
func (r *CarRepository) CreateCarByAdmin(req AdminCreateCarRequest) (*Car, error) {
	status := "draft"

	car := &Car{
		SellerID:     req.SellerID,
		BrandName:    req.BrandName,
		ModelName:    req.ModelName,
		SubmodelName: req.SubmodelName,
		Year:         req.Year,
		Price:        req.Price,
		Mileage:      req.Mileage,
		Status:       status,
		IsFlooded:        false,
		IsHeavilyDamaged: false,
	}

	query := `
		INSERT INTO cars (
			seller_id, brand_name, model_name, submodel_name, year,
			price, mileage, status, 
			is_flooded, is_heavily_damaged
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8,
			$9, $10
		)
		RETURNING id, seller_id, brand_name, model_name, submodel_name, year,
				  price, mileage, status, created_at, updated_at`

	err := r.db.DB.QueryRow(query,
		car.SellerID, car.BrandName, car.ModelName, car.SubmodelName, car.Year,
		car.Price, car.Mileage, car.Status,
		car.IsFlooded, car.IsHeavilyDamaged,
	).Scan(
		&car.ID, &car.SellerID, &car.BrandName, &car.ModelName, &car.SubmodelName, &car.Year,
		&car.Price, &car.Mileage, &car.Status, &car.CreatedAt, &car.UpdatedAt,
	)

	if err != nil {
		if strings.Contains(err.Error(), "violates foreign key constraint") {
			return nil, fmt.Errorf("seller with ID %d not found", req.SellerID)
		}
		return nil, fmt.Errorf("failed to create car: %w", err)
	}

	return car, nil
}

// CountCarsByStatus counts cars by a specific status
func (r *CarRepository) CountCarsByStatus(status string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM cars WHERE status = $1`

	err := r.db.DB.QueryRow(query, status).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count cars by status: %w", err)
	}

	return count, nil
}

// GetCarsBySellerID retrieves all cars for a seller
func (r *CarRepository) GetCarsBySellerID(sellerID int) ([]Car, error) {
	query := `
		SELECT id, seller_id, body_type_code, transmission_code,
			drivetrain_code, brand_name, model_name, submodel_name, 
			chassis_number, year, mileage, engine_cc,
			seats, doors, prefix, number, 
			province_id, description, price, is_flooded, 
			is_heavily_damaged, status, condition_rating, created_at, updated_at
		FROM cars
		WHERE seller_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.DB.Query(query, sellerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get cars by seller: %w", err)
	}
	defer rows.Close()

	var cars []Car
	for rows.Next() {
		var car Car
		err := rows.Scan(
			&car.ID, &car.SellerID, &car.BodyTypeCode, &car.TransmissionCode, &car.DrivetrainCode,
			&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
			&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
			&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
			&car.IsFlooded, &car.IsHeavilyDamaged,
			&car.Status, &car.ConditionRating, &car.CreatedAt, &car.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan car: %w", err)
		}
		cars = append(cars, car)
	}

	return cars, nil
}

// SearchCarsRequest represents search/filter parameters
type SearchCarsRequest struct {
	Query            string   // Search query for brand/model/description
	MinPrice         *int     // Minimum price filter
	MaxPrice         *int     // Maximum price filter
	ProvinceID       *int     // Province filter
	MinYear          *int     // Minimum year filter
	MaxYear          *int     // Maximum year filter
	BodyTypeCode     *string  // Body type filter (code like "PICKUP", "SUV")
	TransmissionCode *string  // Transmission filter (code like "MANUAL", "AT")
	DrivetrainCode   *string  // Drivetrain filter (code like "FWD", "AWD", "4WD")
	FuelTypeCodes    []string // Fuel type filters (codes like "GASOLINE", "DIESEL")
	ColorCodes       []string // Color filters (codes like "WHITE", "BLACK", "GRAY")
	Status           string   // Status filter (default: "active")
	Limit            int      // Results per page (default: 20)
	Offset           int      // Pagination offset (default: 0)
}

// GetActiveCars retrieves all active car listings with optional filters
func (r *CarRepository) GetActiveCars(req *SearchCarsRequest) ([]Car, int, error) {
	// Build WHERE clauses
	whereClauses := []string{"status = $1"}
	args := []interface{}{req.Status}
	argCounter := 2

	if req.MinPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("price >= $%d", argCounter))
		args = append(args, *req.MinPrice)
		argCounter++
	}

	if req.MaxPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("price <= $%d", argCounter))
		args = append(args, *req.MaxPrice)
		argCounter++
	}

	if req.ProvinceID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("province_id = $%d", argCounter))
		args = append(args, *req.ProvinceID)
		argCounter++
	}

	if req.MinYear != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("year >= $%d", argCounter))
		args = append(args, *req.MinYear)
		argCounter++
	}

	if req.MaxYear != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("year <= $%d", argCounter))
		args = append(args, *req.MaxYear)
		argCounter++
	}

	if req.BodyTypeCode != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("cars.body_type_code = $%d", argCounter))
		args = append(args, *req.BodyTypeCode)
		argCounter++
	}

	if req.TransmissionCode != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("cars.transmission_code = $%d", argCounter))
		args = append(args, *req.TransmissionCode)
		argCounter++
	}

	if req.DrivetrainCode != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("cars.drivetrain_code = $%d", argCounter))
		args = append(args, *req.DrivetrainCode)
		argCounter++
	}

	// Fuel type filter (requires JOIN with car_fuel)
	fuelJoin := ""
	if len(req.FuelTypeCodes) > 0 {
		// Build IN clause for fuel types
		fuelPlaceholders := make([]string, len(req.FuelTypeCodes))
		for i, fuelCode := range req.FuelTypeCodes {
			fuelPlaceholders[i] = fmt.Sprintf("$%d", argCounter)
			args = append(args, fuelCode)
			argCounter++
		}
		fuelJoin = " INNER JOIN car_fuel ON cars.id = car_fuel.car_id"
		whereClauses = append(whereClauses, fmt.Sprintf("car_fuel.fuel_type_code IN (%s)", strings.Join(fuelPlaceholders, ",")))
	}

	// Color filter (requires JOIN with car_colors)
	colorJoin := ""
	if len(req.ColorCodes) > 0 {
		// Build IN clause for colors
		colorPlaceholders := make([]string, len(req.ColorCodes))
		for i, colorCode := range req.ColorCodes {
			colorPlaceholders[i] = fmt.Sprintf("$%d", argCounter)
			args = append(args, colorCode)
			argCounter++
		}
		colorJoin = " INNER JOIN car_colors ON cars.id = car_colors.car_id"
		whereClauses = append(whereClauses, fmt.Sprintf("car_colors.color_code IN (%s)", strings.Join(colorPlaceholders, ",")))
	}

	// Text search on brand/model/description in cars
	if req.Query != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(cars.brand_name ILIKE $%d OR cars.model_name ILIKE $%d OR cars.description ILIKE $%d)",
			argCounter, argCounter+1, argCounter+2,
		))
		searchPattern := "%" + req.Query + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argCounter += 3
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Count total results (with DISTINCT if joins are used)
	countQuery := ""
	joinClause := fuelJoin + colorJoin
	if joinClause != "" {
		countQuery = fmt.Sprintf("SELECT COUNT(DISTINCT cars.id) FROM cars%s WHERE %s", joinClause, whereSQL)
	} else {
		countQuery = fmt.Sprintf("SELECT COUNT(*) FROM cars WHERE %s", whereSQL)
	}
	var total int
	err := r.db.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cars: %w", err)
	}

	// Get paginated results (with DISTINCT if joins are used)
	selectClause := "SELECT"
	if joinClause != "" {
		selectClause = "SELECT DISTINCT"
	}
	query := fmt.Sprintf(`
        %s cars.id, cars.seller_id, cars.body_type_code, cars.transmission_code, cars.drivetrain_code,
            cars.brand_name, cars.model_name, cars.submodel_name, cars.chassis_number,
            cars.year, cars.mileage, cars.engine_cc, cars.seats, cars.doors,
            cars.prefix, cars.number, cars.province_id, cars.description, cars.price,
            cars.is_flooded, cars.is_heavily_damaged,
            cars.status, cars.condition_rating, cars.created_at, cars.updated_at
        FROM cars%s
        WHERE %s
        ORDER BY cars.created_at DESC
        LIMIT $%d OFFSET $%d`, selectClause, joinClause, whereSQL, argCounter, argCounter+1)

	args = append(args, req.Limit, req.Offset)

	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get cars: %w", err)
	}
	defer rows.Close()

	var cars []Car
	for rows.Next() {
		var car Car
		err := rows.Scan(
			&car.ID, &car.SellerID, &car.BodyTypeCode, &car.TransmissionCode, &car.DrivetrainCode,
			&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
			&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
			&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
			&car.IsFlooded, &car.IsHeavilyDamaged, &car.Status, &car.ConditionRating,
			&car.CreatedAt, &car.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan car: %w", err)
		}
		cars = append(cars, car)
	}

	return cars, total, nil
}

// UpdateCar updates a car listing
func (r *CarRepository) UpdateCar(car *Car) error {
	query := `
    	UPDATE cars SET
    		body_type_code = $2, transmission_code = $3, drivetrain_code = $4,
    		brand_name = $5, model_name = $6, submodel_name = $7, chassis_number = $8,
    		year = $9, mileage = $10, engine_cc = $11, seats = $12, doors = $13,
    		prefix = $14, number = $15, province_id = $16, description = $17, price = $18,
    		is_flooded = $19, is_heavily_damaged = $20,
    		status = $21, condition_rating = $22
    	WHERE id = $1`

	result, err := r.db.DB.Exec(query,
		car.ID, car.BodyTypeCode, car.TransmissionCode, car.DrivetrainCode,
		car.BrandName, car.ModelName, car.SubmodelName, car.ChassisNumber,
		car.Year, car.Mileage, car.EngineCC, car.Seats, car.Doors,
		car.Prefix, car.Number, car.ProvinceID, car.Description, car.Price,
		car.IsFlooded, car.IsHeavilyDamaged,
		car.Status, car.ConditionRating,
	)

	if err != nil {
		return fmt.Errorf("failed to update car: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("car not found")
	}

	return nil
}

// DeleteCar deletes a car listing
func (r *CarRepository) DeleteCar(carID int) error {
	query := `DELETE FROM cars WHERE id = $1`

	result, err := r.db.DB.Exec(query, carID)
	if err != nil {
		return fmt.Errorf("failed to delete car: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("car not found")
	}

	return nil
}

// FindCarsByChassisNumber finds cars by chassis number (exact match) excluding deleted
func (r *CarRepository) FindCarsByChassisNumber(chassisNumber string) ([]Car, error) {
	query := `
		SELECT id, seller_id, body_type_code, transmission_code, drivetrain_code,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats, doors,
			prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged,
			status, condition_rating, created_at, updated_at
		FROM cars
		WHERE chassis_number = $1 AND status != 'deleted'
		ORDER BY created_at DESC`

	rows, err := r.db.DB.Query(query, chassisNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to find cars by chassis: %w", err)
	}
	defer rows.Close()

	var cars []Car
	for rows.Next() {
		var car Car
		err := rows.Scan(
			&car.ID, &car.SellerID, &car.BodyTypeCode, &car.TransmissionCode, &car.DrivetrainCode,
			&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
			&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
			&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
			&car.IsFlooded, &car.IsHeavilyDamaged,
			&car.Status, &car.ConditionRating, &car.CreatedAt, &car.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan car: %w", err)
		}
		cars = append(cars, car)
	}

	return cars, nil
}

func (r *CarRepository) GetBodyTypeLabelByCode(code string, lang string) (string, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	var label string
	query := fmt.Sprintf("SELECT %s FROM body_types WHERE code = $1", nameCol)
	err := r.db.DB.QueryRow(query, code).Scan(&label)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return label, err
}

// GetTransmissionLabelByCode returns the display label for a transmission code
func (r *CarRepository) GetTransmissionLabelByCode(code string, lang string) (string, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	var label string
	query := fmt.Sprintf("SELECT %s FROM transmissions WHERE code = $1", nameCol)
	err := r.db.DB.QueryRow(query, code).Scan(&label)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return label, err
}

// GetDrivetrainLabelByCode returns the display label for a drivetrain code
func (r *CarRepository) GetDrivetrainLabelByCode(code string, lang string) (string, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	var label string
	query := fmt.Sprintf("SELECT %s FROM drivetrains WHERE code = $1", nameCol)
	err := r.db.DB.QueryRow(query, code).Scan(&label)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return label, err
}

// GetProvinceLabelByID returns the display label for a province ID
func (r *CarRepository) GetProvinceLabelByID(id int, lang string) (string, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	var label string
	query := fmt.Sprintf("SELECT %s FROM provinces WHERE id = $1", nameCol)
	err := r.db.DB.QueryRow(query, id).Scan(&label)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return label, err
}

// GetFuelLabelsByCodes returns display labels for fuel type codes
func (r *CarRepository) GetFuelLabelsByCodes(codes []string, lang string) ([]string, error) {
	if len(codes) == 0 {
		return []string{}, nil
	}

	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(codes))
	args := make([]interface{}, len(codes))
	for i, code := range codes {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = code
	}

	query := fmt.Sprintf("SELECT %s FROM fuel_types WHERE code IN (%s) ORDER BY code",
		labelCol, strings.Join(placeholders, ","))

	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []string
	for rows.Next() {
		var label string
		if err := rows.Scan(&label); err != nil {
			return nil, err
		}
		labels = append(labels, label)
	}

	return labels, nil
}

// GetColorLabelsByCodes returns display labels for color codes
func (r *CarRepository) GetColorLabelsByCodes(codes []string, lang string) ([]string, error) {
	if len(codes) == 0 {
		return []string{}, nil
	}

	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(codes))
	args := make([]interface{}, len(codes))
	for i, code := range codes {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = code
	}

	// Query both code and label to build a map
	query := fmt.Sprintf(
		"SELECT code, %s FROM colors WHERE code IN (%s)",
		labelCol,
		strings.Join(placeholders, ","),
	)

	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Build map of code -> label
	codeToLabel := make(map[string]string)
	for rows.Next() {
		var code, label string
		if err := rows.Scan(&code, &label); err != nil {
			return nil, err
		}
		codeToLabel[code] = label
	}

	// Reconstruct labels in the order of input codes
	labels := make([]string, 0, len(codes))
	for _, code := range codes {
		if label, ok := codeToLabel[code]; ok {
			labels = append(labels, label)
		}
	}

	return labels, nil
}

// CarImageRepository handles car image-related database operations
type CarImageRepository struct {
	db *Database
}

// NewCarImageRepository creates a new car image repository
func NewCarImageRepository(db *Database) *CarImageRepository {
	return &CarImageRepository{db: db}
}

// CreateCarImage stores an image in the database
func (r *CarImageRepository) CreateCarImage(image *CarImage) error {
	query := `
		INSERT INTO car_images (car_id, image_data, image_type, image_size, display_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, uploaded_at`

	err := r.db.DB.QueryRow(query,
		image.CarID, image.ImageData, image.ImageType, image.ImageSize, image.DisplayOrder,
	).Scan(&image.ID, &image.UploadedAt)

	if err != nil {
		return fmt.Errorf("failed to create car image: %w", err)
	}

	return nil
}

// GetCarImageByID retrieves a single image with data
func (r *CarImageRepository) GetCarImageByID(imageID int) (*CarImage, error) {
	image := &CarImage{}
	query := `
		SELECT id, car_id, image_data, image_type, image_size, display_order, uploaded_at
		FROM car_images
		WHERE id = $1`

	err := r.db.DB.QueryRow(query, imageID).Scan(
		&image.ID, &image.CarID, &image.ImageData, &image.ImageType,
		&image.ImageSize, &image.DisplayOrder, &image.UploadedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to get image: %w", err)
	}

	return image, nil
}

// GetCarImagesMetadata retrieves all image metadata for a car (without image data)
func (r *CarImageRepository) GetCarImagesMetadata(carID int) ([]CarImageMetadata, error) {
	query := `
		SELECT id, car_id, image_type, image_size, display_order, uploaded_at
		FROM car_images
		WHERE car_id = $1
		ORDER BY display_order, uploaded_at`

	rows, err := r.db.DB.Query(query, carID)
	if err != nil {
		return nil, fmt.Errorf("failed to get car images metadata: %w", err)
	}
	defer rows.Close()

	var images []CarImageMetadata
	for rows.Next() {
		var img CarImageMetadata
		err := rows.Scan(&img.ID, &img.CarID, &img.ImageType, &img.ImageSize, &img.DisplayOrder, &img.UploadedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan image metadata: %w", err)
		}
		images = append(images, img)
	}

	return images, nil
}

// CountCarImages counts the number of images for a car
func (r *CarImageRepository) CountCarImages(carID int) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM car_images WHERE car_id = $1`

	err := r.db.DB.QueryRow(query, carID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count car images: %w", err)
	}

	return count, nil
}

// DeleteCarImage deletes a single image
func (r *CarImageRepository) DeleteCarImage(imageID int) error {
	query := `DELETE FROM car_images WHERE id = $1`

	result, err := r.db.DB.Exec(query, imageID)
	if err != nil {
		return fmt.Errorf("failed to delete car image: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("image not found")
	}

	return nil
}

// DeleteAllCarImages deletes all images for a car
func (r *CarImageRepository) DeleteAllCarImages(carID int) error {
	query := `DELETE FROM car_images WHERE car_id = $1`

	_, err := r.db.DB.Exec(query, carID)
	if err != nil {
		return fmt.Errorf("failed to delete car images: %w", err)
	}

	return nil
}

// ReorderImages updates display_order for multiple images in one transaction
func (r *CarImageRepository) ReorderImages(imageIDs []int) error {
	// Start transaction
	tx, err := r.db.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update each image with its new position
	for i, imageID := range imageIDs {
		_, err = tx.Exec(
			"UPDATE car_images SET display_order = $1 WHERE id = $2",
			i, imageID,
		)
		if err != nil {
			return fmt.Errorf("failed to update image %d: %w", imageID, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// CarFuelRepository handles car_fuel operations
type CarFuelRepository struct {
	db *Database
}

// NewCarFuelRepository creates a new car fuel repository
func NewCarFuelRepository(db *Database) *CarFuelRepository {
	return &CarFuelRepository{db: db}
}

// SetCarFuels replaces all fuels for a car
func (r *CarFuelRepository) SetCarFuels(carID int, fuelCodes []string) error {
	// Start transaction
	tx, err := r.db.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing fuels
	_, err = tx.Exec("DELETE FROM car_fuel WHERE car_id = $1", carID)
	if err != nil {
		return fmt.Errorf("failed to delete existing fuels: %w", err)
	}

	// Insert new fuels
	for _, fuelCode := range fuelCodes {
		_, err = tx.Exec(
			"INSERT INTO car_fuel (car_id, fuel_type_code) VALUES ($1, $2)",
			carID, fuelCode,
		)
		if err != nil {
			return fmt.Errorf("failed to insert fuel %s: %w", fuelCode, err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetCarFuels retrieves all fuel codes for a car
func (r *CarFuelRepository) GetCarFuels(carID int) ([]string, error) {
	query := `
		SELECT fuel_type_code 
		FROM car_fuel 
		WHERE car_id = $1 
		ORDER BY fuel_type_code`

	rows, err := r.db.DB.Query(query, carID)
	if err != nil {
		return nil, fmt.Errorf("failed to get car fuels: %w", err)
	}
	defer rows.Close()

	var fuelCodes []string
	for rows.Next() {
		var fuelCode string
		if err := rows.Scan(&fuelCode); err != nil {
			return nil, fmt.Errorf("failed to scan fuel: %w", err)
		}
		fuelCodes = append(fuelCodes, fuelCode)
	}

	return fuelCodes, nil
}

// CarColor represents a car-color mapping with position
type CarColor struct {
	CarID     int    `json:"carId" db:"car_id"`
	ColorCode string `json:"colorCode" db:"color_code"`
	Position  int    `json:"position" db:"position"`
}

// CarColorRepository handles car_colors operations
type CarColorRepository struct {
	db *Database
}

// NewCarColorRepository creates a new car color repository
func NewCarColorRepository(db *Database) *CarColorRepository {
	return &CarColorRepository{db: db}
}

// SetCarColors replaces all colors for a car with ordered list
func (r *CarColorRepository) SetCarColors(carID int, colorCodes []string) error {
	// Start transaction
	tx, err := r.db.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete existing colors
	if _, err = tx.Exec("DELETE FROM car_colors WHERE car_id = $1", carID); err != nil {
		return fmt.Errorf("failed to delete existing colors: %w", err)
	}

	// Insert new colors with positions
	for i, colorCode := range colorCodes {
		if _, err = tx.Exec(
			"INSERT INTO car_colors (car_id, color_code, position) VALUES ($1, $2, $3)",
			carID, colorCode, i,
		); err != nil {
			return fmt.Errorf("failed to insert color at position %d: %w", i, err)
		}
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// GetCarColors retrieves all color code for a car in order
func (r *CarColorRepository) GetCarColors(carID int) ([]string, error) {
	query := `
        SELECT color_code
        FROM car_colors 
        WHERE car_id = $1 
        ORDER BY position`
	rows, err := r.db.DB.Query(query, carID)
	if err != nil {
		return nil, fmt.Errorf("failed to get car colors: %w", err)
	}
	defer rows.Close()
	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, fmt.Errorf("failed to scan color id: %w", err)
		}
		codes = append(codes, code)
	}
	return codes, nil
}

// LookupColorLabelsByCodes looks up color labels by exact color codes (e.g., "RED", "WHITE", "GRAY")
func (r *CarColorRepository) LookupColorLabelsByCodes(codes []string, lang string) ([]string, error) {
	if len(codes) == 0 {
		return []string{}, nil
	}

	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(codes))
	args := make([]interface{}, len(codes))
	for i, code := range codes {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = code
	}

	query := fmt.Sprintf("SELECT %s FROM colors WHERE code IN (%s) ORDER BY code", labelCol, strings.Join(placeholders, ","))
	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup colors by codes: %w", err)
	}
	defer rows.Close()

	var colors []string
	for rows.Next() {
		var label string
		if err := rows.Scan(&label); err != nil {
			return nil, fmt.Errorf("failed to scan color: %w", err)
		}
		colors = append(colors, label)
	}

	return colors, nil
}

func (r *CarColorRepository) LookupColorCodesByLabels(labels []string, lang string) ([]string, error) {
	if len(labels) == 0 {
		return []string{}, nil
	}

	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}

	placeholders := make([]string, len(labels))
	args := make([]interface{}, len(labels))
	for i, label := range labels {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = label
	}

	query := fmt.Sprintf("SELECT code FROM colors WHERE %s IN (%s) ORDER BY code", labelCol, strings.Join(placeholders, ","))
	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup colors by labels: %w", err)
	}
	defer rows.Close()
	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, fmt.Errorf("failed to scan color code: %w", err)
		}
		codes = append(codes, code)
	}
	return codes, nil
}

// Reference data lookup repositories
func (r *CarRepository) LookupProvinceByName(name string) (*int, error) {
	var id int
	query := `SELECT id FROM provinces WHERE name_th ILIKE $1 OR name_en ILIKE $1 LIMIT 1`
	err := r.db.DB.QueryRow(query, name).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, fmt.Errorf("failed to lookup province: %w", err)
	}
	return &id, nil
}

// LookupBodyTypeByName finds body type code by Thai or English name
func (r *CarRepository) LookupBodyTypeByName(name string) (*string, error) {
	var code string
	query := `SELECT code FROM body_types WHERE name_th ILIKE $1 OR name_en ILIKE $1 LIMIT 1`
	err := r.db.DB.QueryRow(query, name).Scan(&code)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to lookup body type: %w", err)
	}
	return &code, nil
}

// LookupTransmissionByName finds transmission code by Thai or English name
func (r *CarRepository) LookupTransmissionByName(name string) (*string, error) {
	var code string
	query := `SELECT code FROM transmissions WHERE name_th ILIKE $1 OR name_en ILIKE $1 LIMIT 1`
	err := r.db.DB.QueryRow(query, name).Scan(&code)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to lookup transmission: %w", err)
	}
	return &code, nil
}

// LookupDrivetrainByName finds drivetrain code by Thai or English name
func (r *CarRepository) LookupDrivetrainByName(name string) (*string, error) {
	var code string
	query := `SELECT code FROM drivetrains WHERE name_th ILIKE $1 OR name_en ILIKE $1 LIMIT 1`
	err := r.db.DB.QueryRow(query, name).Scan(&code)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to lookup drivetrain: %w", err)
	}
	return &code, nil
}

// LookupFuelCodesByLabels finds fuel codes by Thai or English labels (exact match)
func (r *CarRepository) LookupFuelCodesByLabels(labels []string) ([]string, error) {
	if len(labels) == 0 {
		return []string{}, nil
	}
	args := []interface{}{}
	wheres := []string{}
	for i, label := range labels {
		args = append(args, label)
		wheres = append(wheres, fmt.Sprintf("(label_th = $%d OR label_en = $%d)", i+1, i+1))
	}
	query := "SELECT DISTINCT code FROM fuel_types WHERE " + strings.Join(wheres, " OR ")
	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup fuel codes: %w", err)
	}
	defer rows.Close()
	var codes []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, fmt.Errorf("failed to scan fuel code: %w", err)
		}
		codes = append(codes, code)
	}
	return codes, nil
}
