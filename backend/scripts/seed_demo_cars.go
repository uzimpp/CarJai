package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// === CONFIGURATION SECTION ===
// Easy to modify settings for mock data generation

const (
	NUM_CARS_TO_CREATE = 30
	DEMO_EMAIL         = "demo-seller@carjai.com"
	DEMO_PASSWORD      = "Demo123456" // Will be hashed as bcrypt
)

// Car generation ranges and options
var (
	PRICE_RANGE         = [2]int{300000, 1500000}      // ฿300k - ฿1.5M
	YEAR_RANGE          = [2]int{2015, 2024}           // 2015-2024
	MILEAGE_RANGE       = [2]int{10000, 200000}        // 10k-200k km
	CONDITION_RANGE     = [2]int{3, 5}                 // Rating 3-5
	ENGINE_CC_RANGE     = [2]int{1000, 3500}           // 1000-3500cc
	SEATS_RANGE         = [2]int{2, 8}                 // 2-8 seats
	
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

// === END CONFIGURATION ===

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

func main() {
	// Load environment variables
	// In Docker, env vars are already set, so .env file is optional
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("No .env file found, using environment variables from Docker")
	}

	// Connect to database
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "carjai")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Seed random
	rand.Seed(time.Now().UnixNano())

	// Step 1: Create demo seller account
	sellerID, err := createDemoSeller(db)
	if err != nil {
		log.Fatalf("Failed to create demo seller: %v", err)
	}
	log.Printf("✓ Created demo seller (ID: %d)", sellerID)

	// Step 2: Get reference data
	provinces, err := getProvinces(db)
	if err != nil {
		log.Fatalf("Failed to get provinces: %v", err)
	}
	log.Printf("✓ Loaded %d provinces", len(provinces))

	// Use configuration values for consistent data generation
	bodyTypes := BODY_TYPES
	transmissions := TRANSMISSIONS
	drivetrains := DRIVETRAINS
	fuelTypes := FUEL_TYPES
	colors := COLORS

	// Step 3: Create demo cars
	log.Printf("\nCreating %d demo cars with sellerID=%d...", NUM_CARS_TO_CREATE, sellerID)
	for i := 1; i <= NUM_CARS_TO_CREATE; i++ {
		carID, err := createCar(db, sellerID, i, provinces, bodyTypes, transmissions, drivetrains, fuelTypes, colors)
		if err != nil {
			log.Printf("✗ Failed to create car %d: %v", i, err)
			continue
		}
		log.Printf("  ✓ Car %d created (ID: %d)", i, carID)
	}

	log.Println("\n✅ Demo data seeding completed!")
}

func createDemoSeller(db *sql.DB) (int, error) {
	// Check if demo seller already exists
	var existingUserID int
	err := db.QueryRow(`SELECT id FROM users WHERE email = $1`, DEMO_EMAIL).Scan(&existingUserID)
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

	// Create user account
	var userID int
	hashedPassword := "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi" // bcrypt hash of "Demo123456"
	err = db.QueryRow(`
		INSERT INTO users (email, password_hash, username, name)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, DEMO_EMAIL, hashedPassword, "demoseller", "Demo Seller").Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("failed to create user: %w", err)
	}

	// Create seller profile
	_, err = db.Exec(`
		INSERT INTO sellers (id, display_name, about, map_link)
		VALUES ($1, $2, $3, $4)
	`, userID, "Demo Car Sales", "Demo seller for testing", "https://maps.google.com")
	if err != nil {
		return 0, fmt.Errorf("failed to create seller: %w", err)
	}

	// Create seller contacts
	_, err = db.Exec(`
		INSERT INTO seller_contacts (seller_id, contact_type, value, label)
		VALUES ($1, $2, $3, $4), ($1, $5, $6, $7)
	`, userID, "phone", "0812345678", "Call", "line", "@democar", "LINE")
	if err != nil {
		return 0, fmt.Errorf("failed to create seller contacts: %w", err)
	}

	return userID, nil
}

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

func createCar(db *sql.DB, sellerID, index int, provinces []int, bodyTypes, transmissions, drivetrains, fuelTypes, colors []string) (int, error) {
	// Random data using configuration
	brand := randomKey(brandModels)
	model := randomItem(brandModels[brand])
	year := randomInt(YEAR_RANGE[0], YEAR_RANGE[1])
	mileage := randomInt(MILEAGE_RANGE[0], MILEAGE_RANGE[1])
	price := randomInt(PRICE_RANGE[0], PRICE_RANGE[1])
	provinceID := randomItem(provinces)
	bodyType := randomItem(bodyTypes)
	transmission := randomItem(transmissions)
	drivetrain := randomItem(drivetrains)
	conditionRating := randomInt(CONDITION_RANGE[0], CONDITION_RANGE[1])
	engineCC := randomInt(1200, 3500)
	seats := randomSeats(bodyType)
	doors := randomDoors(bodyType)
	chassisNumber := fmt.Sprintf("DEMO%d%08d", year, index)
	prefix := randomPrefix()
	number := fmt.Sprintf("%d", randomInt(1000, 9999))
	description := fmt.Sprintf("Well-maintained %s %s in excellent condition", brand, model)

	// Insert car
	var carID int
	err := db.QueryRow(`
		INSERT INTO cars (
			seller_id, body_type_code, transmission_code, drivetrain_code,
			brand_name, model_name, chassis_number, year, mileage, engine_cc,
			seats, doors, prefix, number, province_id, description, price,
			is_flooded, is_heavily_damaged, status, condition_rating
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
			$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
		) RETURNING id
	`, sellerID, bodyType, transmission, drivetrain, brand, model, chassisNumber,
		year, mileage, engineCC, seats, doors, prefix, number, provinceID,
		description, price, false, false, "active", conditionRating).Scan(&carID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert car: %w", err)
	}

	// Add fuel types (1-2 random fuels)
	numFuels := randomInt(1, 2)
	selectedFuels := randomItems(fuelTypes, numFuels)
	for _, fuel := range selectedFuels {
		_, err = db.Exec(`INSERT INTO car_fuel (car_id, fuel_type_code) VALUES ($1, $2)`, carID, fuel)
		if err != nil {
			return 0, fmt.Errorf("failed to insert fuel: %w", err)
		}
	}

	// Add colors (1-2 colors)
	numColors := randomInt(1, 2)
	selectedColors := randomItems(colors, numColors)
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

func addInspectionResult(db *sql.DB, carID int) error {
	// 80% chance of passing inspection
	overallPass := rand.Float32() < 0.8

	// If overall pass, all individual results should pass
	individualPass := overallPass || rand.Float32() < 0.9

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
		individualPass, individualPass, individualPass, individualPass, individualPass,
		individualPass, individualPass, individualPass, individualPass,
		individualPass, individualPass, individualPass, individualPass,
		individualPass, individualPass, individualPass, individualPass, individualPass, individualPass)

	return err
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func randomKey(m map[string][]string) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys[rand.Intn(len(keys))]
}

func randomItem[T any](items []T) T {
	return items[rand.Intn(len(items))]
}

func randomItems[T any](items []T, count int) []T {
	if count >= len(items) {
		return items
	}
	
	// Shuffle and take first N
	shuffled := make([]T, len(items))
	copy(shuffled, items)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})
	
	return shuffled[:count]
}

func randomInt(min, max int) int {
	return min + rand.Intn(max-min+1)
}

func calculatePrice(year int, brand string) int {
	// Base price by year
	basePrice := 200000 + (year-2010)*50000

	// Luxury brand multiplier
	luxuryBrands := map[string]float64{
		"MERCEDES BENZ": 3.0,
		"BMW":           3.0,
		"PORSCHE":       5.0,
		"TESLA":         2.5,
	}

	if multiplier, ok := luxuryBrands[brand]; ok {
		basePrice = int(float64(basePrice) * multiplier)
	}

	// Add some randomness (-10% to +20%)
	variance := float64(basePrice) * (rand.Float64()*0.3 - 0.1)
	return basePrice + int(variance)
}

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

