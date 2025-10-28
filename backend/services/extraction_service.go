package services

import (
	"bytes"
	"context" // *** เพิ่ม context ***
	"database/sql" // *** เพิ่ม database/sql ***
	"encoding/json" // *** เพิ่ม encoding/json (สำหรับ marshal กรณี debug) ***
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// MarketPrice represents the structure for market price data.
type MarketPrice struct {
	Brand     string    `json:"brand"`
	ModelTrim string    `json:"model_trim"`
	YearStart int       `json:"year_start"`
	YearEnd   int       `json:"year_end"`
	PriceMin  int64     `json:"price_min_thb"`
	PriceMax  int64     `json:"price_max_thb"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// brandSet (POC version - potentially load dynamically in production)
var brandSet = map[string]bool{
	"AION": true, "ALFA ROMEO": true, "ASTON MARTIN": true, "AUDI": true, "AUSTIN": true,
	"AVATR": true, "BENTLEY": true, "BMW": true, "BYD": true, "CADILLAC": true,
	"CHANGAN": true, "CHERY": true, "CHEVROLET": true, "CHRYSLER": true, "CITROEN": true,
	"DAIHATSU": true, "DEEPAL": true, "DENZA": true, "DFSK": true, "FERRARI": true,
	"FIAT": true, "FORD": true, "GEELY": true, "GWM TANK": true, "HAVAL": true,
	"HINO": true, "HONDA": true, "HUMMER": true, "HYUNDAI": true, "ISUZU": true,
	"JAECOO": true, "JAGUAR": true, "JEEP": true, "ΚΙΑ": true, // Note: Greek Kappa might cause issues, check PDF source if needed
	"LAMBORGHINI": true, "LAND ROVER": true, "LEAPMOTOR": true, "LEXUS": true, "LOTUS": true,
	"MASERATI": true, "MAZDA": true, "MCLAREN": true, "MERCEDES BENZ": true, "MG": true,
	"MINI": true, "MITSUBISHI": true, "MITSUOKA": true, "NAZA": true, "NETA": true,
	"NISSAN": true, "OMODA": true, "OPEL": true, "ORA": true, "PEUGEOT": true,
	"PORSCHE": true, "PROTON": true, "RANGE ROVER": true, "RIDDARA": true, "ROLLS-ROYCE": true,
	"ROVER": true, "SAAB": true, "SEAT": true, "SKODA": true, "SSANGYONG": true,
	"SUBARU": true, "SUZUKI": true, "TATA": true, "TESLA": true, "THAIRUNG": true,
	"TOYOTA": true, "VOLKSWAGEN": true, "VOLVO": true, "WULING": true, "XPENG": true,
	"ZEEKR": true,
	// Motorcycle brands (added for completeness)
	"AJ": true, "APRILIA": true, "ARIIC": true, "BAJAJ": true, "BENELLI": true,
	"CFMOTO": true, "DECO": true, "DUCATI": true, "EM": true, "GPX": true, "H SEM": true,
	"HAONAIQI": true, "HARLEY DAVIDSON": true, "HUSQVARNA": true, "INDIAN": true,
	"JRD": true, "KAVALLO": true, "KAWASAKI": true, "KTM": true, "LAMBRETTA": true, "LION": true,
	"M-BIKE": true, "MOTO GUZZI": true, "MV AGUSTA": true, "PIAGGIO": true,
	"PLATINUM": true, "ROYAL ENFIELD": true, "RYUKA": true, "SCOMADI": true, "SOLAR": true,
	"STALLIONS": true, "SYM": true, "TIGER": true, "TRIUMPH": true,
	"VESPA": true, "YAMAHA": true,
}

// Regex definitions
var (
	// Car data (single line)
	dataRegex = regexp.MustCompile(`^(.+?)\s+(\d{4}-\d{4})\s+(.+)$`)
	// Year range (stricter: space optional around hyphen)
	yearRegex = regexp.MustCompile(`^(\d{4})\s*-\s*(\d{4})$`)
	// Price range (allows numbers, commas, spaces, hyphens)
	priceRegex = regexp.MustCompile(`^[\d,\s-]+$`) // Basic check, parsing logic handles format
	// Clean price string
	cleanRegex = regexp.MustCompile(`[,\$]`)
	// Skip lines
	skipLineRegex         = regexp.MustCompile(`^(\d{1,3}|\d{4})$`) // Page numbers or years
	headerRegex           = regexp.MustCompile(`(?i)(แบบ\s*/\s*รุ่น|ปีผลิต|ราคาประเมิน|สารบัญ|แบบ/รุ่น\s*อื่นๆ)`) // Added "แบบ/รุ่น อื่นๆ"
	motorcycleHeaderRegex = regexp.MustCompile(`(?i)รถจักรยานยนต์`)
	pageSeparatorRegex    = regexp.MustCompile(`\f`)
)

// Parsing State for multi-line entries
type ParseState int

const (
	ExpectingModel ParseState = iota
	ExpectingYear
	ExpectingPrice
)

// cleanPriceString removes unwanted characters from a price string.
func cleanPriceString(priceStr string) string {
	return cleanRegex.ReplaceAllString(priceStr, "")
}

// parseYearRange converts "YYYY-YYYY" or "YYYY - YYYY" to (startYear, endYear).
func parseYearRange(yearStr string) (int, int, error) {
	matches := yearRegex.FindStringSubmatch(yearStr)
	if len(matches) != 3 {
		return 0, 0, fmt.Errorf("invalid year format: %s", yearStr)
	}
	start, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid start year '%s': %w", matches[1], err)
	}
	end, err := strconv.Atoi(matches[2])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid end year '%s': %w", matches[2], err)
	}
	return start, end, nil
}

// parsePriceRange converts "min max" or "min-max" to (minPrice, maxPrice).
func parsePriceRange(priceStr string) (int64, int64, error) {
	if !priceRegex.MatchString(priceStr) { // Pre-check format
		return 0, 0, fmt.Errorf("string does not match price pattern: %s", priceStr)
	}
	priceStr = cleanPriceString(priceStr)
	var parts []string
	if strings.Contains(priceStr, " ") {
		parts = strings.Fields(priceStr)
	} else if strings.Contains(priceStr, "-") {
		parts = strings.Split(priceStr, "-")
	} else {
		parts = []string{priceStr}
	}

	var validParts []string
	for _, p := range parts {
		if p != "" {
			validParts = append(validParts, p)
		}
	}
	parts = validParts

	if len(parts) == 0 {
		return 0, 0, fmt.Errorf("empty price string after cleaning")
	}

	if len(parts) == 1 {
		price, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return 0, 0, fmt.Errorf("invalid single price number '%s': %w", parts[0], err)
		}
		return price, price, nil
	}

	minPrice, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid min price '%s': %w", parts[0], err)
	}
	maxPrice, err := strconv.ParseInt(parts[len(parts)-1], 10, 64) // Use the last part as max
	if err != nil {
		return 0, 0, fmt.Errorf("invalid max price '%s': %w", parts[len(parts)-1], err)
	}

	if minPrice > maxPrice {
		log.Printf("Swapping prices for line '%s': min=%d, max=%d", priceStr, minPrice, maxPrice)
		return maxPrice, minPrice, nil
	}
	return minPrice, maxPrice, nil
}


// ExtractAndPrintMarketPricesPOC performs PDF extraction using pdftotext and inserts/updates data into the DB.
func ExtractAndPrintMarketPricesPOC(ctx context.Context, db *sql.DB, filePath string) error {
	log.Printf("Attempting to extract text using pdftotext from: %s", filePath)
	cmd := exec.Command("pdftotext", filePath, "-")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		log.Printf("pdftotext error output: %s", stderr.String())
		return fmt.Errorf("failed to run pdftotext command: %w", err)
	}
	log.Println("pdftotext command executed successfully.")
	fullText := out.String()

	var allPrices []MarketPrice
	var currentBrand string
	currentPage := 1
	currentState := ExpectingModel
	var tempModel string
	var tempYearStart, tempYearEnd int

	lines := strings.Split(fullText, "\n")

	// --- Logic การ Parse Text ---
	for lineNum, line := range lines {
		if pageSeparatorRegex.MatchString(line) {
			currentPage++
			currentState = ExpectingModel
			tempModel = ""
			continue
		}

		line = strings.TrimSpace(line)
		if line == "" { continue }
		if currentPage < 8 { continue } // Skip early pages

		// Check for Brand first
		potentialBrand := line
		if _, isBrand := brandSet[potentialBrand]; isBrand {
			isLikelyContinuation := !strings.Contains(potentialBrand, " ") && len(strings.Fields(potentialBrand)) == 1
			if currentBrand != "" && isLikelyContinuation && brandSet[currentBrand+" "+potentialBrand] {
				currentBrand = currentBrand + " " + potentialBrand
				log.Printf("Page ~%d: Updated brand to: %s", currentPage, currentBrand)
			} else {
				currentBrand = potentialBrand
				log.Printf("Page ~%d: Switched brand to: %s", currentPage, currentBrand)
			}
			currentState = ExpectingModel
			tempModel = ""
			continue
		}

		if currentBrand == "" { continue } // Skip if no brand context

		// Skip headers, page numbers, years
		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			if currentState != ExpectingModel {
				log.Printf("Page ~%d, Line %d: Resetting state due to skip line: %s", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
			continue
		}

		// Try matching Single-Line (Car) format first
		carMatches := dataRegex.FindStringSubmatch(line)
		if len(carMatches) == 4 {
			modelTrim := strings.TrimSpace(carMatches[1])
			yearStr := carMatches[2]
			priceStr := strings.TrimSpace(carMatches[3])
			modelTrim = strings.TrimSuffix(modelTrim, yearStr)
			modelTrim = strings.TrimSpace(modelTrim)

			if modelTrim != "" {
				yearStart, yearEnd, errYear := parseYearRange(yearStr)
				priceMin, priceMax, errPrice := parsePriceRange(priceStr)

				if errYear == nil && errPrice == nil {
					now := time.Now()
					marketPrice := MarketPrice{ Brand: currentBrand, ModelTrim: modelTrim, YearStart: yearStart, YearEnd: yearEnd, PriceMin: priceMin, PriceMax: priceMax, CreatedAt: now, UpdatedAt: now }
					allPrices = append(allPrices, marketPrice)
					// log.Printf("Page ~%d, Line %d: Parsed single-line entry: %s", currentPage, lineNum+1, modelTrim)
					currentState = ExpectingModel
					tempModel = ""
					continue // Move to next line
				} else {
					log.Printf("Page ~%d, Line %d: Single-line regex matched but parsing failed (YearErr: %v, PriceErr: %v): %s", currentPage, lineNum+1, errYear, errPrice, line)
				}
			}
		}

		// If not single-line, process with State Machine
		switch currentState {
		case ExpectingModel:
			if yearRegex.MatchString(line) || priceRegex.MatchString(line) {
				log.Printf("Page ~%d, Line %d: WARNING - Expected model, but line looks like year/price. Skipping: %s", currentPage, lineNum+1, line)
			} else {
				tempModel = line
				currentState = ExpectingYear
			}
		case ExpectingYear:
			yearStart, yearEnd, errYear := parseYearRange(line)
			if errYear == nil {
				tempYearStart = yearStart
				tempYearEnd = yearEnd
				currentState = ExpectingPrice
			} else {
				log.Printf("Page ~%d, Line %d: WARNING - Expected year, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
		case ExpectingPrice:
			priceMin, priceMax, errPrice := parsePriceRange(line)
			if errPrice == nil {
				now := time.Now()
				marketPrice := MarketPrice{
					Brand:     currentBrand,
					ModelTrim: tempModel,
					YearStart: tempYearStart,
					YearEnd:   tempYearEnd,
					PriceMin:  priceMin,
					PriceMax:  priceMax,
					CreatedAt: now,
					UpdatedAt: now,
				}
				allPrices = append(allPrices, marketPrice)
				// log.Printf("Page ~%d, Line %d: Parsed multi-line entry: %s", currentPage, lineNum+1, tempModel)
				currentState = ExpectingModel
				tempModel = ""
			} else {
				log.Printf("Page ~%d, Line %d: WARNING - Expected price, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
		} // end switch
	} // end line loop

	log.Printf("Successfully extracted %d records.", len(allPrices))

	// --- ส่วน Database Insertion/Update ---
	log.Println("Starting database insertion/update...")
	insertedCount := 0
	updatedCount := 0

	// เตรียม SQL statement (UPSERT)
	stmt, err := db.PrepareContext(ctx, `
		INSERT INTO market_price (brand, model_trim, year_start, year_end, price_min_thb, price_max_thb, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (brand, model_trim, year_start, year_end)
		DO UPDATE SET
			price_min_thb = EXCLUDED.price_min_thb,
			price_max_thb = EXCLUDED.price_max_thb,
			updated_at = EXCLUDED.updated_at
		RETURNING (xmax = 0) AS inserted; -- xmax=0 indicates INSERT
	`)
	if err != nil {
		// Log detailed error for debugging preparation failure
		log.Printf("Error preparing statement: %v", err)
		// Try to provide more context if possible, e.g., was DB connection successful?
		pingErr := db.PingContext(ctx)
		if pingErr != nil {
			log.Printf("Database ping also failed: %v", pingErr)
		}
		return fmt.Errorf("failed to prepare upsert statement: %w", err)
	}
	defer stmt.Close()


	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	// Use defer with a function literal to handle potential rollback error
	defer func() {
		if err != nil { // Check if an error occurred during the loop or commit
			log.Println("Rolling back transaction due to error.")
			rollbackErr := tx.Rollback()
			if rollbackErr != nil {
				log.Printf("Error during transaction rollback: %v", rollbackErr)
			}
		}
	}()


	txStmt := tx.StmtContext(ctx, stmt) // Use statement within transaction

	for i, price := range allPrices {
		var inserted bool
		// Log the data being inserted for debugging potential issues
		// log.Printf("Upserting record %d: %+v", i+1, price)
		scanErr := txStmt.QueryRowContext(ctx,
			price.Brand,
			price.ModelTrim,
			price.YearStart,
			price.YearEnd,
			price.PriceMin,
			price.PriceMax,
			price.CreatedAt,
			price.UpdatedAt,
		).Scan(&inserted)

		if scanErr != nil {
			// Log the specific record causing the error
			recordJson, _ := json.Marshal(price) // Marshal for easy logging
			log.Printf("Failed to upsert record #%d [%s]: %v", i+1, string(recordJson), scanErr)
			// Assign error to outer scope err to trigger rollback
			err = fmt.Errorf("failed to upsert record #%d: %w", i+1, scanErr)
			return err // Stop processing and trigger rollback
		}

		if inserted {
			insertedCount++
		} else {
			updatedCount++
		}
	}

	// Commit Transaction if loop completed without errors
	log.Println("Attempting to commit transaction...")
	if err == nil { // Only commit if no error occurred during the loop
		commitErr := tx.Commit()
		if commitErr != nil {
			err = fmt.Errorf("failed to commit transaction: %w", commitErr) // Assign error to trigger rollback defer
			log.Printf("Commit failed: %v", err)
			return err // Return commit error
		}
	}


	log.Printf("Database operation completed successfully. Inserted: %d, Updated: %d", insertedCount, updatedCount)
	return nil // Return nil on successful commit
}
