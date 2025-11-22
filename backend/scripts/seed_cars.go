package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"

	"github.com/uzimpp/CarJai/backend/utils"
)

const (
	NUM_CARS_TO_CREATE = 30
)

// Car generation ranges and options
var (
	PRICE_RANGE     = [2]int{299, 2999}    // ฿299 - ฿2,999 * 1000 = ฿299,000 - ฿2,999,000
	YEAR_RANGE      = [2]int{2012, 2025}   // 2012-2025
	MILEAGE_RANGE   = [2]int{5000, 150000} // 5k-150k km
	CONDITION_RANGE = [2]int{2, 5}         // Rating 3-5
	ENGINE_CC_RANGE = [2]int{1000, 3500}   // 1000-3500cc
	SEATS_RANGE     = [2]int{2, 8}         // 2-8 seats

	// Body type codes
	BODY_TYPES = []string{"PICKUP", "SUV", "CITYCAR", "DAILY", "VAN", "SPORTLUX"}

	// Transmission codes
	TRANSMISSIONS = []string{"MANUAL", "AT"}

	// Drivetrain codes
	DRIVETRAINS = []string{"FWD", "RWD", "AWD", "4WD"}

	// Fuel type codes (cars can have multiple)
	FUEL_TYPES = []string{"GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "CNG"}

	// Color codes (cars can have multiple)
	COLORS = []string{"WHITE", "BLACK", "GRAY", "RED", "BLUE", "BROWN", "YELLOW"}
)

// Car brands and their models
var brandModels = map[string][]string{
	"HONDA":         {"Civic", "Accord", "CR-V", "HR-V", "City"},
	"TOYOTA":        {"Camry", "Corolla", "Fortuner", "Yaris", "Vios", "Hilux"},
	"MAZDA":         {"CX-5", "CX-3", "Mazda3", "Mazda2", "MX-5"},
	"NISSAN":        {"Almera", "Note", "Navara", "Terra", "GT-R"},
	"MITSUBISHI":    {"Pajero Sport", "Triton", "Attrage", "Mirage"},
	"ISUZU":         {"D-Max", "MU-X"},
	"MERCEDES BENZ": {"C-Class", "E-Class", "GLC", "S-Class"},
	"BMW":           {"3 Series", "5 Series", "X3", "X5"},
	"TESLA":         {"Model 3", "Model Y", "Model S"},
	"HYUNDAI":       {"Tucson", "Santa Fe", "Elantra", "Accent"},
	"KIA":           {"Seltos", "Sorento", "Cerato", "Rio"},
	"VOLKSWAGEN":    {"Tiguan", "Golf", "Passat", "Polo"},
	"PORSCHE":       {"Cayenne", "Macan", "911", "Panamera"},
}

// Model submodels mapping
var modelSubmodels = map[string][]string{
	"Civic":        {"EL", "EX", "Sport", "Type R", "RS"},
	"Accord":       {"EX", "EX-L", "Touring", "Sport"},
	"CR-V":         {"LX", "EX", "EX-L", "Touring"},
	"HR-V":         {"LX", "EX", "EX-L"},
	"City":         {"E", "EL", "EX", "RS"},
	"Camry":        {"LE", "XLE", "SE", "XSE", "TRD"},
	"Corolla":      {"LE", "XLE", "SE", "XSE", "GR"},
	"Fortuner":     {"G", "V", "Legender", "Rocco"},
	"Yaris":        {"E", "G", "S"},
	"Vios":         {"E", "G", "S"},
	"Hilux":        {"Prerunner", "4WD", "Revo", "Rocco"},
	"CX-5":         {"Sport", "Touring", "Grand Touring", "Signature"},
	"CX-3":         {"Sport", "Touring", "Grand Touring"},
	"Mazda3":       {"Sport", "Touring", "Grand Touring"},
	"Mazda2":       {"Sport", "Touring"},
	"MX-5":         {"Sport", "Club", "Grand Touring"},
	"Almera":       {"E", "VL", "V", "Tekna"},
	"Note":         {"E", "VL", "V"},
	"Navara":       {"E", "VL", "V", "Pro-4X"},
	"Terra":        {"E", "VL", "V", "Pro-4X"},
	"GT-R":         {"Premium", "Track Edition", "Nismo"},
	"Pajero Sport": {"GLX", "GLS", "Ultimate"},
	"Triton":       {"GLX", "GLS", "Ultimate"},
	"Attrage":      {"GLS", "GLS Premium"},
	"Mirage":       {"GLX", "GLS"},
	"D-Max":        {"Prerunner", "4WD", "X-Series", "Rocco"},
	"MU-X":         {"LS", "LS-A", "LS-U"},
	"C-Class":      {"C200", "C300", "AMG C43", "AMG C63"},
	"E-Class":      {"E200", "E300", "AMG E53", "AMG E63"},
	"GLC":          {"GLC200", "GLC300", "AMG GLC43"},
	"S-Class":      {"S350", "S450", "S500", "AMG S63"},
	"3 Series":     {"320i", "330i", "M340i", "M3"},
	"5 Series":     {"520i", "530i", "M550i", "M5"},
	"X3":           {"xDrive20i", "xDrive30i", "M40i"},
	"X5":           {"xDrive30d", "xDrive40i", "M50i", "X5M"},
	"Model 3":      {"Standard Range", "Long Range", "Performance"},
	"Model Y":      {"Long Range", "Performance"},
	"Model S":      {"Long Range", "Plaid"},
	"Tucson":       {"GL", "GLS", "Premium"},
	"Santa Fe":     {"GL", "GLS", "Premium"},
	"Elantra":      {"GL", "GLS", "Premium"},
	"Accent":       {"GL", "GLS"},
	"Seltos":       {"EX", "GT-Line", "GT"},
	"Sorento":      {"EX", "GT-Line", "GT"},
	"Cerato":       {"EX", "GT-Line", "GT"},
	"Rio":          {"EX", "GT-Line"},
	"Tiguan":       {"Comfortline", "Highline", "R-Line"},
	"Golf":         {"Comfortline", "Highline", "GTI", "R"},
	"Passat":       {"Comfortline", "Highline"},
	"Polo":         {"Comfortline", "Highline"},
	"Cayenne":      {"Base", "S", "Turbo", "GTS"},
	"Macan":        {"Base", "S", "GTS", "Turbo"},
	"911":          {"Carrera", "Carrera S", "Turbo", "GT3"},
	"Panamera":     {"Base", "S", "Turbo", "GTS"},
}

// Image files available
var imageFiles = []string{
	"2020 Aston Martin Vantage.jpg",
	"alphard.jpg",
	"audi.png",
	"benz_amg.png",
	"benz.png",
	"bmw.png",
	"fortuner.png",
	"honda_accord.png",
	"honda_city.png",
	"honda_civic.png",
	"Mazda PNG (1).png",
	"Mazda PNG 132.png",
	"Mazda PNG.png",
	"Nissan GTR PNG 2048x1360.png",
	"porsche_2door.png",
	"porsche_convertible.png",
	"porsche_front_black.png",
	"porsche_stinger.png",
	"porsche_suv.png",
	"White Audi Car PNG.png",
}

// seedCarsData seeds cars with images and inspections
func seedCarsData(db *sql.DB) error {
	// Step 1: Create or get demo seller account
	sellerID, err := createOrGetDemoSeller(db)
	if err != nil {
		return fmt.Errorf("failed to create/get demo seller: %w", err)
	}
	log.Printf("✓ Using demo seller (ID: %d)", sellerID)

	// Step 2: Get reference data
	provinces, err := getProvinces(db)
	if err != nil {
		return fmt.Errorf("failed to get provinces: %w", err)
	}
	log.Printf("✓ Loaded %d provinces", len(provinces))

	// Step 3: Create demo cars
	log.Printf("Creating %d demo cars with sellerID=%d...", NUM_CARS_TO_CREATE, sellerID)
	for i := 1; i <= NUM_CARS_TO_CREATE; i++ {
		carID, err := createCar(db, sellerID, i, provinces)
		if err != nil {
			log.Printf("✗ Failed to create car %d: %v", i, err)
			continue
		}
		log.Printf("  ✓ Car %d created (ID: %d)", i, carID)
	}

	return nil
}

// createOrGetDemoSeller creates or gets the demo seller account
func createOrGetDemoSeller(db *sql.DB) (int, error) {
	// Check if demo seller already exists
	var existingUserID int
	err := db.QueryRow(`SELECT id FROM users WHERE email = $1`, DEMO_SELLER_EMAIL).Scan(&existingUserID)
	if err == nil {
		// User exists, check if seller profile exists
		var sellerExists bool
		err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM sellers WHERE id = $1)`, existingUserID).Scan(&sellerExists)
		if err == nil && sellerExists {
			log.Printf("Demo seller already exists (ID: %d)", existingUserID)
			return existingUserID, nil
		}
		// User exists but seller profile doesn't, delete user and recreate everything
		log.Println("Found incomplete seller data, cleaning up...")
		_, err = db.Exec(`DELETE FROM users WHERE id = $1`, existingUserID)
		if err != nil {
			return 0, fmt.Errorf("failed to delete incomplete user: %w", err)
		}
	}

	// Hash password using actual hashing function
	hashedPassword, err := utils.HashPassword(DEMO_PASSWORD)
	if err != nil {
		return 0, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user account
	var userID int
	err = db.QueryRow(`
		INSERT INTO users (email, password_hash, username, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, DEMO_SELLER_EMAIL, hashedPassword, DEMO_SELLER_USERNAME, DEMO_SELLER_NAME).Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("failed to create user: %w", err)
	}

	// Create seller profile
	_, err = db.Exec(`
		INSERT INTO sellers (id, display_name, about, map_link)
		VALUES ($1, $2, $3, $4)
	`, userID, DEMO_SELLER_NAME, DEMO_SELLER_ABOUT, DEMO_SELLER_MAP_LINK)
	if err != nil {
		return 0, fmt.Errorf("failed to create seller: %w", err)
	}

	// Create seller contacts
	_, err = db.Exec(`
		INSERT INTO seller_contacts (seller_id, contact_type, value, label)
		VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)
	`, userID, DEMO_SELLER_CONTACT_TYPE, DEMO_SELLER_CONTACT_VALUE, DEMO_SELLER_CONTACT_LABEL,
		DEMO_SELLER_CONTACT_TYPE_2, DEMO_SELLER_CONTACT_VALUE_2, DEMO_SELLER_CONTACT_LABEL_2)
	if err != nil {
		return 0, fmt.Errorf("failed to create seller contacts: %w", err)
	}

	return userID, nil
}

// getProvinces gets province IDs from database
func getProvinces(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id FROM provinces ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var provinces []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		provinces = append(provinces, id)
	}
	return provinces, nil
}

// createCar creates a car with all related data
func createCar(db *sql.DB, sellerID, index int, provinces []int) (int, error) {
	// Random data using configuration
	brand := randomKey(brandModels)
	model := randomItem(brandModels[brand])

	// Get submodel (may be empty if model doesn't have submodels)
	var submodel *string
	if submodels, exists := modelSubmodels[model]; exists && len(submodels) > 0 {
		submodelStr := randomItem(submodels)
		submodel = &submodelStr
	}

	year := randomInt(YEAR_RANGE[0], YEAR_RANGE[1])
	mileage := randomInt(MILEAGE_RANGE[0], MILEAGE_RANGE[1])
	price := randomInt(PRICE_RANGE[0], PRICE_RANGE[1]) * 1000
	provinceID := randomItem(provinces)
	bodyType := randomItem(BODY_TYPES)
	transmission := randomItem(TRANSMISSIONS)
	drivetrain := randomItem(DRIVETRAINS)
	conditionRating := randomInt(CONDITION_RANGE[0], CONDITION_RANGE[1])
	engineCC := randomInt(1200, 3500)
	seats := randomSeats(bodyType)
	doors := randomDoors(bodyType)
	chassisNumber := fmt.Sprintf("DEMO%d%08d", year, index)
	prefix := randomPrefix()
	number := fmt.Sprintf("%d", randomInt(1000, 9999))

	// Build description with submodel if available
	carName := fmt.Sprintf("%s %s", brand, model)
	if submodel != nil && *submodel != "" {
		carName = fmt.Sprintf("%s %s", carName, *submodel)
	}
	description := fmt.Sprintf("Well-maintained %s in excellent condition", carName)

	// Insert car
	var carID int
	err := db.QueryRow(`
		INSERT INTO cars (
			seller_id, body_type_code, transmission_code, drivetrain_code,
			brand_name, model_name, submodel_name, chassis_number, year, mileage, engine_cc,
			seats, doors, prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged, status, condition_rating
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
			$12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		) RETURNING id
	`, sellerID, bodyType, transmission, drivetrain, brand, model, submodel, chassisNumber,
		year, mileage, engineCC, seats, doors, prefix, number, provinceID,
		description, price, false, false, "active", conditionRating).Scan(&carID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert car: %w", err)
	}

	// Add fuel types (1-2 random fuels)
	numFuels := randomInt(1, 2)
	selectedFuels := randomItems(FUEL_TYPES, numFuels)
	for _, fuel := range selectedFuels {
		_, err = db.Exec(`INSERT INTO car_fuel (car_id, fuel_type_code) VALUES ($1, $2)`, carID, fuel)
		if err != nil {
			return 0, fmt.Errorf("failed to insert fuel: %w", err)
		}
	}

	// Add colors (1-2 colors)
	numColors := randomInt(1, 2)
	selectedColors := randomItems(COLORS, numColors)
	for i, color := range selectedColors {
		_, err = db.Exec(`INSERT INTO car_colors (car_id, color_code, position) VALUES ($1, $2, $3)`, carID, color, i)
		if err != nil {
			return 0, fmt.Errorf("failed to insert color: %w", err)
		}
	}

	// Add images (6-10 random images)
	numImages := randomInt(6, 10)
	selectedImages := randomItems(imageFiles, numImages)
	if err := addCarImages(db, carID, selectedImages); err != nil {
		return 0, fmt.Errorf("failed to add images: %w", err)
	}

	// Add inspection result (80% pass rate)
	if err := addInspectionResult(db, carID); err != nil {
		return 0, fmt.Errorf("failed to add inspection: %w", err)
	}

	return carID, nil
}

// addCarImages adds images to a car
func addCarImages(db *sql.DB, carID int, imageFiles []string) error {
	// Path to images - supports both local and Docker environments
	imagesPath := "../../frontend/public/assets/cars/"

	// Check if running in Docker (alternative path)
	if _, err := os.Stat("/app/frontend/public/assets/cars"); err == nil {
		imagesPath = "/app/frontend/public/assets/cars/"
	}

	for i, imgFile := range imageFiles {
		imagePath := filepath.Join(imagesPath, imgFile)

		// Read image file
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Printf("Warning: Could not read image %s: %v", imgFile, err)
			continue
		}

		// Detect image type from extension
		imageType := "image/jpeg"
		if filepath.Ext(imgFile) == ".png" {
			imageType = "image/png"
		}

		// Insert image
		_, err = db.Exec(`
			INSERT INTO car_images (car_id, image_data, image_type, image_size, display_order)
			VALUES ($1, $2, $3, $4, $5)
		`, carID, imageData, imageType, len(imageData), i)
		if err != nil {
			return fmt.Errorf("failed to insert image %s: %w", imgFile, err)
		}
	}

	return nil
}

// addInspectionResult adds an inspection result to a car
func addInspectionResult(db *sql.DB, carID int) error {
	// Randomly generate each individual test result independently
	// Each test has a random chance of passing (typically 70-90% chance)
	brakeResult := rand.Float32() < 0.85
	handbrakeResult := rand.Float32() < 0.80
	alignmentResult := rand.Float32() < 0.75
	noiseResult := rand.Float32() < 0.70
	emissionResult := rand.Float32() < 0.75
	hornResult := rand.Float32() < 0.90
	speedometerResult := rand.Float32() < 0.85
	highLowBeamResult := rand.Float32() < 0.80
	signalLightsResult := rand.Float32() < 0.75
	otherLightsResult := rand.Float32() < 0.80
	windshieldResult := rand.Float32() < 0.85
	steeringResult := rand.Float32() < 0.80
	wheelsTiresResult := rand.Float32() < 0.75
	fuelTankResult := rand.Float32() < 0.85
	chassisResult := rand.Float32() < 0.80
	bodyResult := rand.Float32() < 0.85
	doorsFloorResult := rand.Float32() < 0.85
	seatbeltResult := rand.Float32() < 0.90
	wiperResult := rand.Float32() < 0.80

	// Collect all individual results in a slice
	individualResults := []bool{
		brakeResult, handbrakeResult, alignmentResult, noiseResult, emissionResult,
		hornResult, speedometerResult, highLowBeamResult, signalLightsResult, otherLightsResult,
		windshieldResult, steeringResult, wheelsTiresResult, fuelTankResult, chassisResult,
		bodyResult, doorsFloorResult, seatbeltResult, wiperResult,
	}

	// Calculate passing count
	passedCount := 0
	for _, result := range individualResults {
		if result {
			passedCount++
		}
	}

	totalTests := len(individualResults)

	// Overall pass only if passing percentage is >= 50%
	overallPass := float32(passedCount)/float32(totalTests) >= 0.5

	_, err := db.Exec(`
		INSERT INTO car_inspection_results (
			car_id, station, overall_pass,
			brake_result, handbrake_result, alignment_result, noise_result, emission_result,
			horn_result, speedometer_result, high_low_beam_result, signal_lights_result,
			other_lights_result, windshield_result, steering_result, wheels_tires_result,
			fuel_tank_result, chassis_result, body_result, doors_floor_result, seatbelt_result, wiper_result
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
		)
	`, carID, "Bangkok Inspection Center", overallPass,
		brakeResult, handbrakeResult, alignmentResult, noiseResult, emissionResult,
		hornResult, speedometerResult, highLowBeamResult, signalLightsResult, otherLightsResult,
		windshieldResult, steeringResult, wheelsTiresResult, fuelTankResult, chassisResult,
		bodyResult, doorsFloorResult, seatbeltResult, wiperResult)

	return err
}

// Helper functions for car generation

func randomSeats(bodyType string) int {
	switch bodyType {
	case "PICKUP":
		return []int{2, 4, 5}[rand.Intn(3)]
	case "VAN":
		return []int{7, 8, 9, 12}[rand.Intn(4)]
	case "CITYCAR":
		return []int{4, 5}[rand.Intn(2)]
	case "SUV":
		return []int{5, 7}[rand.Intn(2)]
	case "SPORTLUX":
		return []int{2, 4, 5}[rand.Intn(3)]
	default:
		return 5
	}
}

func randomDoors(bodyType string) int {
	switch bodyType {
	case "PICKUP":
		return []int{2, 4}[rand.Intn(2)]
	case "VAN":
		return []int{4, 5}[rand.Intn(2)]
	case "SPORTLUX":
		return []int{2, 4}[rand.Intn(2)]
	default:
		return 4
	}
}

func randomPrefix() string {
	prefixes := []string{"กข", "กง", "กค", "กท", "ขย", "ขบ", "ทร", "นค", "บก", "ปล"}
	return prefixes[rand.Intn(len(prefixes))]
}
