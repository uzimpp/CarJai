package models

import (
	"database/sql"
	"fmt"
	"time"
)

// Car represents a car listing
type Car struct {
	CID             int        `json:"cid" db:"cid"`
	SellerID        int        `json:"sellerId" db:"seller_id"`
	Year            *int       `json:"year" db:"year"`
	Mileage         *int       `json:"mileage" db:"mileage"`
	Price           int        `json:"price" db:"price"`
	Province        *string    `json:"province" db:"province"`
	ConditionRating *int       `json:"conditionRating" db:"condition_rating"`
	BodyTypeID      *int       `json:"bodyTypeId" db:"body_type_id"`
	TransmissionID  *int       `json:"transmissionId" db:"transmission_id"`
	FuelTypeID      *int       `json:"fuelTypeId" db:"fuel_type_id"`
	DrivetrainID    *int       `json:"drivetrainId" db:"drivetrain_id"`
	Seats           *int       `json:"seats" db:"seats"`
	Doors           *int       `json:"doors" db:"doors"`
	Color           *string    `json:"color" db:"color"`
	Status          string     `json:"status" db:"status"`
	OCRApplied      bool       `json:"ocrApplied" db:"ocr_applied"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" db:"updated_at"`
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
	Year            *int    `json:"year"`
	Mileage         *int    `json:"mileage"`
	Price           int     `json:"price" validate:"required,gt=0"`
	Province        *string `json:"province"`
	ConditionRating *int    `json:"conditionRating" validate:"omitempty,gte=1,lte=5"`
	BodyTypeID      *int    `json:"bodyTypeId"`
	TransmissionID  *int    `json:"transmissionId"`
	FuelTypeID      *int    `json:"fuelTypeId"`
	DrivetrainID    *int    `json:"drivetrainId"`
	Seats           *int    `json:"seats"`
	Doors           *int    `json:"doors"`
	Color           *string `json:"color"`
	Status          *string `json:"status" validate:"omitempty,oneof=draft active sold"`
}

type UpdateCarRequest struct {
	Year            *int    `json:"year"`
	Mileage         *int    `json:"mileage"`
	Price           *int    `json:"price" validate:"omitempty,gt=0"`
	Province        *string `json:"province"`
	ConditionRating *int    `json:"conditionRating" validate:"omitempty,gte=1,lte=5"`
	BodyTypeID      *int    `json:"bodyTypeId"`
	TransmissionID  *int    `json:"transmissionId"`
	FuelTypeID      *int    `json:"fuelTypeId"`
	DrivetrainID    *int    `json:"drivetrainId"`
	Seats           *int    `json:"seats"`
	Doors           *int    `json:"doors"`
	Color           *string `json:"color"`
	Status          *string `json:"status" validate:"omitempty,oneof=draft active sold"`
}

type CarResponse struct {
	Success bool    `json:"success"`
	Data    Car     `json:"data"`
	Message string  `json:"message,omitempty"`
}

type CarListResponse struct {
	Success bool   `json:"success"`
	Data    []Car  `json:"data"`
	Message string `json:"message,omitempty"`
}

type CarWithImagesResponse struct {
	Success bool               `json:"success"`
	Data    CarWithImages      `json:"data"`
	Message string             `json:"message,omitempty"`
}

type CarWithImages struct {
	Car    Car                `json:"car"`
	Images []CarImageMetadata `json:"images"`
}

type ImageUploadResponse struct {
	Success bool             `json:"success"`
	Data    ImageUploadData  `json:"data"`
	Message string           `json:"message,omitempty"`
}

type ImageUploadData struct {
	CarID        int                `json:"carId"`
	UploadedCount int               `json:"uploadedCount"`
	Images       []CarImageMetadata `json:"images"`
}

// CarRepository handles car-related database operations
type CarRepository struct {
	db *Database
}

// NewCarRepository creates a new car repository
func NewCarRepository(db *Database) *CarRepository {
	return &CarRepository{db: db}
}

// CreateCar creates a new car listing
func (r *CarRepository) CreateCar(car *Car) error {
	query := `
		INSERT INTO cars (seller_id, year, mileage, price, province, condition_rating,
			body_type_id, transmission_id, fuel_type_id, drivetrain_id, seats, doors, 
			color, status, ocr_applied)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING cid, created_at, updated_at`
	
	err := r.db.DB.QueryRow(query,
		car.SellerID, car.Year, car.Mileage, car.Price, car.Province,
		car.ConditionRating, car.BodyTypeID, car.TransmissionID,
		car.FuelTypeID, car.DrivetrainID, car.Seats, car.Doors,
		car.Color, car.Status, car.OCRApplied,
	).Scan(&car.CID, &car.CreatedAt, &car.UpdatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create car: %w", err)
	}
	
	return nil
}

// GetCarByID retrieves a car by ID
func (r *CarRepository) GetCarByID(carID int) (*Car, error) {
	car := &Car{}
	query := `
		SELECT cid, seller_id, year, mileage, price, province, condition_rating,
			body_type_id, transmission_id, fuel_type_id, drivetrain_id, seats, doors,
			color, status, ocr_applied, created_at, updated_at
		FROM cars
		WHERE cid = $1`
	
	err := r.db.DB.QueryRow(query, carID).Scan(
		&car.CID, &car.SellerID, &car.Year, &car.Mileage, &car.Price,
		&car.Province, &car.ConditionRating, &car.BodyTypeID,
		&car.TransmissionID, &car.FuelTypeID, &car.DrivetrainID,
		&car.Seats, &car.Doors, &car.Color, &car.Status,
		&car.OCRApplied, &car.CreatedAt, &car.UpdatedAt,
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
		SELECT cid, seller_id, year, mileage, price, province, condition_rating,
			body_type_id, transmission_id, fuel_type_id, drivetrain_id, seats, doors,
			color, status, ocr_applied, created_at, updated_at
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
			&car.CID, &car.SellerID, &car.Year, &car.Mileage, &car.Price,
			&car.Province, &car.ConditionRating, &car.BodyTypeID,
			&car.TransmissionID, &car.FuelTypeID, &car.DrivetrainID,
			&car.Seats, &car.Doors, &car.Color, &car.Status,
			&car.OCRApplied, &car.CreatedAt, &car.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan car: %w", err)
		}
		cars = append(cars, car)
	}
	
	return cars, nil
}

// UpdateCar updates a car listing
func (r *CarRepository) UpdateCar(car *Car) error {
	query := `
		UPDATE cars SET
			year = $2, mileage = $3, price = $4, province = $5,
			condition_rating = $6, body_type_id = $7, transmission_id = $8,
			fuel_type_id = $9, drivetrain_id = $10, seats = $11, doors = $12,
			color = $13, status = $14
		WHERE cid = $1`
	
	result, err := r.db.DB.Exec(query,
		car.CID, car.Year, car.Mileage, car.Price, car.Province,
		car.ConditionRating, car.BodyTypeID, car.TransmissionID,
		car.FuelTypeID, car.DrivetrainID, car.Seats, car.Doors,
		car.Color, car.Status,
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
	query := `DELETE FROM cars WHERE cid = $1`
	
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

