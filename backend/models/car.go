package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Car represents a car listing
type Car struct {
	ID                 int       `json:"id" db:"id"`
	SellerID           int       `json:"sellerId" db:"seller_id"`
	BodyTypeID         *int      `json:"bodyTypeId" db:"body_type_id"`
	TransmissionID     *int      `json:"transmissionId" db:"transmission_id"`
	DrivetrainID       *int      `json:"drivetrainId" db:"drivetrain_id"`
	BrandName          *string   `json:"brandName" db:"brand_name"`
	ModelName          *string   `json:"modelName" db:"model_name"`
	SubmodelName       *string   `json:"submodelName" db:"submodel_name"`
	ChassisNumber      string    `json:"chassisNumber" db:"chassis_number"`
	Year               *int      `json:"year" db:"year"`
	Mileage            *int      `json:"mileage" db:"mileage"`
	EngineCC           *int      `json:"engineCc" db:"engine_cc"`
	Seats              *int      `json:"seats" db:"seats"`
	Doors              *int      `json:"doors" db:"doors"`
	Prefix             *string   `json:"prefix" db:"prefix"`          // Nullable for drafts
	Number             *string   `json:"number" db:"number"`          // Nullable for drafts
	ProvinceID         *int      `json:"provinceId" db:"province_id"` // Nullable for drafts
	Description        *string   `json:"description" db:"description"`
	Price              *int      `json:"price" db:"price"` // Nullable for drafts
	IsFlooded          bool      `json:"isFlooded" db:"is_flooded"`
	IsHeavilyDamaged   bool      `json:"isHeavilyDamaged" db:"is_heavily_damaged"`
	BookUploaded       bool      `json:"bookUploaded" db:"book_uploaded"`
	InspectionUploaded bool      `json:"inspectionUploaded" db:"inspection_uploaded"`
	Status             string    `json:"status" db:"status"`
	ConditionRating    *int      `json:"conditionRating" db:"condition_rating"`
	CreatedAt          time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time `json:"updatedAt" db:"updated_at"`
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

// CarDetails represents car registration data
type CarDetails struct {
	CDID               int        `json:"cdid" db:"cdid"`
	CarID              int        `json:"carId" db:"car_id"`
	BrandName          *string    `json:"brandName" db:"brand_name"`
	ModelName          *string    `json:"modelName" db:"model_name"`
	RegistrationNumber *string    `json:"registrationNumber" db:"registration_number"`
	IssueDate          *time.Time `json:"issueDate" db:"issue_date"`
	ChassisNumber      *string    `json:"chassisNumber" db:"chassis_number"`
	EngineNumber       *string    `json:"engineNumber" db:"engine_number"`
	VehicleType        *string    `json:"vehicleType" db:"vehicle_type"`
	Weight             *float64   `json:"weight" db:"weight"`
	OwnerName          *string    `json:"ownerName" db:"owner_name"`
	RegistrationOffice *string    `json:"registrationOffice" db:"registration_office"`
	CreatedAt          time.Time  `json:"createdAt" db:"created_at"`
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

// Request and Response models
type CreateCarRequest struct {
	// Cars table fields
	BodyTypeID         *int    `json:"bodyTypeId"`
	TransmissionID     *int    `json:"transmissionId"`
	DrivetrainID       *int    `json:"drivetrainId"`
	BrandName          *string `json:"brandName"`
	ModelName          *string `json:"modelName"`
	SubmodelName       *string `json:"submodelName"`
	ChassisNumber      string  `json:"chassisNumber" validate:"required"`
	Year               *int    `json:"year"`
	Mileage            *int    `json:"mileage"`
	EngineCC           *int    `json:"engineCc"`
	Seats              *int    `json:"seats"`
	Doors              *int    `json:"doors"`
	Prefix             *string `json:"prefix"`     // Nullable for drafts
	Number             *string `json:"number"`     // Nullable for drafts
	ProvinceID         *int    `json:"provinceId"` // Nullable for drafts
	Description        *string `json:"description"`
	Price              *int    `json:"price"` // Nullable for drafts
	IsFlooded          bool    `json:"isFlooded"`
	IsHeavilyDamaged   bool    `json:"isHeavilyDamaged"`
	BookUploaded       bool    `json:"bookUploaded"`
	InspectionUploaded bool    `json:"inspectionUploaded"`
	ConditionRating    *int    `json:"conditionRating" validate:"omitempty,gte=1,lte=5"`
	Status             *string `json:"status" validate:"omitempty,oneof=draft active sold deleted"`
}

type UpdateCarRequest struct {
	BodyTypeID         *int    `json:"bodyTypeId"`
	TransmissionID     *int    `json:"transmissionId"`
	DrivetrainID       *int    `json:"drivetrainId"`
	BrandName          *string `json:"brandName"`
	ModelName          *string `json:"modelName"`
	SubmodelName       *string `json:"submodelName"`
	ChassisNumber      *string `json:"chassisNumber"` // Should not be updated normally
	Year               *int    `json:"year"`
	Mileage            *int    `json:"mileage"`
	EngineCC           *int    `json:"engineCc"`
	Seats              *int    `json:"seats"`
	Doors              *int    `json:"doors"`
	Prefix             *string `json:"prefix"`
	Number             *string `json:"number"`
	ProvinceID         *int    `json:"provinceId"`
	Description        *string `json:"description"`
	Price              *int    `json:"price" validate:"omitempty,gt=0"`
	IsFlooded          *bool   `json:"isFlooded"`
	IsHeavilyDamaged   *bool   `json:"isHeavilyDamaged"`
	BookUploaded       *bool   `json:"bookUploaded"`
	InspectionUploaded *bool   `json:"inspectionUploaded"`
	ConditionRating    *int    `json:"conditionRating" validate:"omitempty,gte=1,lte=5"`
	Status             *string `json:"status" validate:"omitempty,oneof=draft active sold deleted"`

	// Unified edit fields for auto-save (not persisted directly on cars unless mapped)
	FuelCodes   []string         `json:"fuelCodes,omitempty"`
	BookDetails *BookEditDetails `json:"bookDetails,omitempty"`
}

// BookEditDetails are editable text fields from the registration book (Thai kept as-is)
type BookEditDetails struct {
	RegistrationNumber *string `json:"registrationNumber,omitempty"`
	BrandName          *string `json:"brandName,omitempty"`
	ModelName          *string `json:"modelName,omitempty"`
	EngineNumber       *string `json:"engineNumber,omitempty"`
	VehicleType        *string `json:"vehicleType,omitempty"`
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

type CarListResponse struct {
	Success bool   `json:"success"`
	Data    []Car  `json:"data"`
	Message string `json:"message,omitempty"`
}

type PaginatedCarListResponse struct {
	Success bool                 `json:"success"`
	Data    PaginatedCarListData `json:"data"`
	Message string               `json:"message,omitempty"`
}

type PaginatedCarListData struct {
	Cars  []Car `json:"cars"`
	Total int   `json:"total"`
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
}

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
	Car    Car                `json:"car"`
	Images []CarImageMetadata `json:"images"`
}

type CarListingWithImages struct {
	ID              int                `json:"id"`
	SellerID        int                `json:"sellerId"`
	Year            *int               `json:"year"`
	Mileage         *int               `json:"mileage"`
	Price           *int               `json:"price"`      // Nullable for drafts
	ProvinceID      *int               `json:"provinceId"` // Nullable for drafts
	ConditionRating *int               `json:"conditionRating"`
	BodyTypeID      *int               `json:"bodyTypeId"`
	TransmissionID  *int               `json:"transmissionId"`
	DrivetrainID    *int               `json:"drivetrainId"`
	Seats           *int               `json:"seats"`
	Doors           *int               `json:"doors"`
	Status          string             `json:"status"`
	CreatedAt       time.Time          `json:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt"`
	BrandName       *string            `json:"brandName"`
	ModelName       *string            `json:"modelName"`
	SubmodelName    *string            `json:"submodelName"`
	Images          []CarImageMetadata `json:"images"`
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
			seller_id, body_type_id, transmission_id, drivetrain_id,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats, doors,
			prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged, book_uploaded, inspection_uploaded,
			status, condition_rating
		) VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8,
			$9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18,
			$19, $20, $21, $22,
			$23, $24
		)
		RETURNING id, created_at, updated_at`

	err := r.db.DB.QueryRow(query,
		car.SellerID, car.BodyTypeID, car.TransmissionID, car.DrivetrainID,
		car.BrandName, car.ModelName, car.SubmodelName, car.ChassisNumber,
		car.Year, car.Mileage, car.EngineCC, car.Seats, car.Doors,
		car.Prefix, car.Number, car.ProvinceID, car.Description, car.Price,
		car.IsFlooded, car.IsHeavilyDamaged, car.BookUploaded, car.InspectionUploaded,
		car.Status, car.ConditionRating,
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
		SELECT id, seller_id, body_type_id, transmission_id, drivetrain_id,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats, doors,
			prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged, book_uploaded, inspection_uploaded,
			status, condition_rating, created_at, updated_at
		FROM cars
		WHERE id = $1`

	err := r.db.DB.QueryRow(query, carID).Scan(
		&car.ID, &car.SellerID, &car.BodyTypeID, &car.TransmissionID, &car.DrivetrainID,
		&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
		&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
		&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
		&car.IsFlooded, &car.IsHeavilyDamaged, &car.BookUploaded, &car.InspectionUploaded,
		&car.Status, &car.ConditionRating, &car.CreatedAt, &car.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("car not found")
		}
		return nil, fmt.Errorf("failed to get car: %w", err)
	}

	return car, nil
}

// GetCarsBySellerID retrieves all cars for a seller
func (r *CarRepository) GetCarsBySellerID(sellerID int) ([]Car, error) {
	query := `
		SELECT id, seller_id, body_type_id, transmission_id, drivetrain_id,
			brand_name, model_name, submodel_name, chassis_number,
			year, mileage, engine_cc, seats, doors,
			prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged, book_uploaded, inspection_uploaded,
			status, condition_rating, created_at, updated_at
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
			&car.ID, &car.SellerID, &car.BodyTypeID, &car.TransmissionID, &car.DrivetrainID,
			&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
			&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
			&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
			&car.IsFlooded, &car.IsHeavilyDamaged, &car.BookUploaded, &car.InspectionUploaded,
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
	Query      string // Search query for brand/model/description
	MinPrice   *int   // Minimum price filter
	MaxPrice   *int   // Maximum price filter
	ProvinceID *int   // Province filter
	MinYear    *int   // Minimum year filter
	MaxYear    *int   // Maximum year filter
	BodyTypeID *int   // Body type filter
	Status     string // Status filter (default: "active")
	Limit      int    // Results per page (default: 20)
	Offset     int    // Pagination offset (default: 0)
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

	if req.BodyTypeID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("body_type_id = $%d", argCounter))
		args = append(args, *req.BodyTypeID)
		argCounter++
	}

	// Text search on brand/model/description in cars
	joinClause := ""
	if req.Query != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(brand_name ILIKE $%d OR model_name ILIKE $%d OR description ILIKE $%d)",
			argCounter, argCounter+1, argCounter+2,
		))
		searchPattern := "%" + req.Query + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argCounter += 3
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Count total results
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM cars %s WHERE %s", joinClause, whereSQL)
	var total int
	err := r.db.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count cars: %w", err)
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT cars.id, cars.seller_id, cars.body_type_id, cars.transmission_id, cars.drivetrain_id,
			cars.brand_name, cars.model_name, cars.submodel_name, cars.chassis_number,
			cars.year, cars.mileage, cars.engine_cc, cars.seats, cars.doors,
			cars.prefix, cars.number, cars.province_id, cars.description, cars.price,
			cars.is_flooded, cars.is_heavily_damaged, cars.book_uploaded, cars.inspection_uploaded,
			cars.status, cars.condition_rating, cars.created_at, cars.updated_at
		FROM cars %s
		WHERE %s
		ORDER BY cars.created_at DESC
		LIMIT $%d OFFSET $%d`, joinClause, whereSQL, argCounter, argCounter+1)

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
			&car.ID, &car.SellerID, &car.BodyTypeID, &car.TransmissionID, &car.DrivetrainID,
			&car.BrandName, &car.ModelName, &car.SubmodelName, &car.ChassisNumber,
			&car.Year, &car.Mileage, &car.EngineCC, &car.Seats, &car.Doors,
			&car.Prefix, &car.Number, &car.ProvinceID, &car.Description, &car.Price,
			&car.IsFlooded, &car.IsHeavilyDamaged, &car.BookUploaded, &car.InspectionUploaded,
			&car.Status, &car.ConditionRating, &car.CreatedAt, &car.UpdatedAt,
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
    		body_type_id = $2, transmission_id = $3, drivetrain_id = $4,
    		brand_name = $5, model_name = $6, submodel_name = $7, chassis_number = $8,
    		year = $9, mileage = $10, engine_cc = $11, seats = $12, doors = $13,
    		prefix = $14, number = $15, province_id = $16, description = $17, price = $18,
    		is_flooded = $19, is_heavily_damaged = $20, book_uploaded = $21, inspection_uploaded = $22,
    		status = $23, condition_rating = $24
    	WHERE id = $1`

	result, err := r.db.DB.Exec(query,
		car.ID, car.BodyTypeID, car.TransmissionID, car.DrivetrainID,
		car.BrandName, car.ModelName, car.SubmodelName, car.ChassisNumber,
		car.Year, car.Mileage, car.EngineCC, car.Seats, car.Doors,
		car.Prefix, car.Number, car.ProvinceID, car.Description, car.Price,
		car.IsFlooded, car.IsHeavilyDamaged, car.BookUploaded, car.InspectionUploaded,
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

// UpdateImageDisplayOrder updates the display order of an image
func (r *CarImageRepository) UpdateImageDisplayOrder(imageID, displayOrder int) error {
	query := `UPDATE car_images SET display_order = $2 WHERE id = $1`

	result, err := r.db.DB.Exec(query, imageID, displayOrder)
	if err != nil {
		return fmt.Errorf("failed to update display order: %w", err)
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

// CarDetailsRepository handles car details (registration data) operations
type CarDetailsRepository struct {
	db *Database
}

// NewCarDetailsRepository creates a new car details repository
func NewCarDetailsRepository(db *Database) *CarDetailsRepository {
	return &CarDetailsRepository{db: db}
}

// CreateCarDetails creates car registration details
func (r *CarDetailsRepository) CreateCarDetails(details *CarDetails) error {
	query := `
		INSERT INTO car_details (car_id, brand_name, model_name, registration_number, 
			chassis_number, engine_number, vehicle_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING cdid, created_at`

	err := r.db.DB.QueryRow(query,
		details.CarID, details.BrandName, details.ModelName, details.RegistrationNumber,
		details.ChassisNumber, details.EngineNumber, details.VehicleType,
	).Scan(&details.CDID, &details.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create car details: %w", err)
	}

	return nil
}

// GetCarDetailsByCarID retrieves car details by car ID
func (r *CarDetailsRepository) GetCarDetailsByCarID(carID int) (*CarDetails, error) {
	details := &CarDetails{}
	query := `
		SELECT cdid, car_id, brand_name, model_name, registration_number, issue_date,
			chassis_number, engine_number, vehicle_type, weight, owner_name, 
			registration_office, created_at
		FROM car_details
		WHERE car_id = $1`

	err := r.db.DB.QueryRow(query, carID).Scan(
		&details.CDID, &details.CarID, &details.BrandName, &details.ModelName,
		&details.RegistrationNumber, &details.IssueDate, &details.ChassisNumber,
		&details.EngineNumber, &details.VehicleType, &details.Weight,
		&details.OwnerName, &details.RegistrationOffice, &details.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No details found is OK
		}
		return nil, fmt.Errorf("failed to get car details: %w", err)
	}

	return details, nil
}

// UpdateCarDetails updates car registration details
func (r *CarDetailsRepository) UpdateCarDetails(details *CarDetails) error {
	query := `
		UPDATE car_details SET
			brand_name = $2, model_name = $3, registration_number = $4,
			chassis_number = $5, engine_number = $6, vehicle_type = $7
		WHERE car_id = $1`

	result, err := r.db.DB.Exec(query,
		details.CarID, details.BrandName, details.ModelName, details.RegistrationNumber,
		details.ChassisNumber, details.EngineNumber, details.VehicleType,
	)

	if err != nil {
		return fmt.Errorf("failed to update car details: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("car details not found")
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
	CarID    int `json:"carId" db:"car_id"`
	ColorID  int `json:"colorId" db:"color_id"`
	Position int `json:"position" db:"position"`
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
func (r *CarColorRepository) SetCarColors(carID int, colorIDs []int) error {
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
	for i, colorID := range colorIDs {
		if _, err = tx.Exec(
			"INSERT INTO car_colors (car_id, color_id, position) VALUES ($1, $2, $3)",
			carID, colorID, i,
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

// GetCarColors retrieves all color IDs for a car in order
func (r *CarColorRepository) GetCarColors(carID int) ([]int, error) {
	query := `
        SELECT color_id 
        FROM car_colors 
        WHERE car_id = $1 
        ORDER BY position`
	rows, err := r.db.DB.Query(query, carID)
	if err != nil {
		return nil, fmt.Errorf("failed to get car colors: %w", err)
	}
	defer rows.Close()
	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan color id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// LookupColorIDsByLabels attempts to find up to 3 color IDs by Thai or English labels (ILIKE)
func (r *CarColorRepository) LookupColorIDsByLabels(labels []string) ([]int, error) {
	if len(labels) == 0 {
		return []int{}, nil
	}
	args := []interface{}{}
	wheres := []string{}
	for i, label := range labels {
		args = append(args, "%"+label+"%")
		wheres = append(wheres, fmt.Sprintf("(label_th ILIKE $%d OR label_en ILIKE $%d)", i+1, i+1))
	}
	query := "SELECT id FROM colors WHERE " + strings.Join(wheres, " OR ") + " LIMIT 3"
	rows, err := r.db.DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to lookup colors by labels: %w", err)
	}
	defer rows.Close()
	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("failed to scan color id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}
