package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json" // Keep for logging
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"
	// No io/ioutil needed
)

// MarketPrice represents the structure for market price data.
type MarketPrice struct {
	Brand     string    `json:"brand"`
	ModelTrim string    `json:"model_trim"`
	YearStart int       `json:"year_start"`
	YearEnd   int       `json:"year_end"`
	PriceMin  int64     `json:"price_min_thb"`
	PriceMax  int64     `json:"price_max_thb"`
	CreatedAt time.Time `json:"created_at"` // Backend might need this for DB, frontend might ignore
	UpdatedAt time.Time `json:"updated_at"` // Backend might need this for DB, frontend might ignore
}

// --- Service Struct and Constructor ---
type ExtractionService struct {
	db *sql.DB // Dependency: Database connection pool
}

// NewExtractionService creates a new instance of ExtractionService.
func NewExtractionService(db *sql.DB) *ExtractionService {
	return &ExtractionService{db: db}
}

// --- Constants and Variables ---
var brandSet = map[string]bool{
	"AION": true, "ALFA ROMEO": true, "ASTON MARTIN": true, "AUDI": true, "AUSTIN": true,
	"AVATR": true, "BENTLEY": true, "BMW": true, "BYD": true, "CADILLAC": true,
	"CHANGAN": true, "CHERY": true, "CHEVROLET": true, "CHRYSLER": true, "CITROEN": true,
	"DAIHATSU": true, "DEEPAL": true, "DENZA": true, "DFSK": true, "FERRARI": true,
	"FIAT": true, "FORD": true, "GEELY": true, "GWM TANK": true, "HAVAL": true,
	"HINO": true, "HONDA": true, "HUMMER": true, "HYUNDAI": true, "ISUZU": true,
	"JAECOO": true, "JAGUAR": true, "JEEP": true, "ΚΙΑ": true,
	"LAMBORGHINI": true, "LAND ROVER": true, "LEAPMOTOR": true, "LEXUS": true, "LOTUS": true,
	"MASERATI": true, "MAZDA": true, "MCLAREN": true, "MERCEDES BENZ": true, "MG": true,
	"MINI": true, "MITSUBISHI": true, "MITSUOKA": true, "NAZA": true, "NETA": true,
	"NISSAN": true, "OMODA": true, "OPEL": true, "ORA": true, "PEUGEOT": true,
	"PORSCHE": true, "PROTON": true, "RANGE ROVER": true, "RIDDARA": true, "ROLLS-ROYCE": true,
	"ROVER": true, "SAAB": true, "SEAT": true, "SKODA": true, "SSANGYONG": true,
	"SUBARU": true, "SUZUKI": true, "TATA": true, "TESLA": true, "THAIRUNG": true,
	"TOYOTA": true, "VOLKSWAGEN": true, "VOLVO": true, "WULING": true, "XPENG": true,
	"ZEEKR": true,
	// Motorcycle brands
	"AJ": true, "APRILIA": true, "ARIIC": true, "BAJAJ": true, "BENELLI": true,
	"CFMOTO": true, "DECO": true, "DUCATI": true, "EM": true, "GPX": true, "H SEM": true,
	"HAONAIQI": true, "HARLEY DAVIDSON": true, "HUSQVARNA": true, "INDIAN": true,
	"JRD": true, "KAVALLO": true, "KAWASAKI": true, "KTM": true, "LAMBRETTA": true, "LION": true,
	"M-BIKE": true, "MOTO GUZZI": true, "MV AGUSTA": true, "PIAGGIO": true,
	"PLATINUM": true, "ROYAL ENFIELD": true, "RYUKA": true, "SCOMADI": true, "SOLAR": true,
	"STALLIONS": true, "SYM": true, "TIGER": true, "TRIUMPH": true,
	"VESPA": true, "YAMAHA": true,
}
var (
	// Regex definitions
	dataRegex             = regexp.MustCompile(`^(.+?)\s+(\d{4}\s*-\s*\d{4})\s+(.+)$`) // Adjusted year part
	yearRegex             = regexp.MustCompile(`^(\d{4})\s*-\s*(\d{4})$`)
	priceRegex            = regexp.MustCompile(`^[\d,\s-]+$`)
	cleanRegex            = regexp.MustCompile(`[,\$]`)
	skipLineRegex         = regexp.MustCompile(`^(\d{1,3}|\d{4})$`)
	headerRegex           = regexp.MustCompile(`(?i)(แบบ\s*/\s*รุ่น|ปีผลิต|ราคาประเมิน|สารบัญ|แบบ/รุ่น\s*อื่นๆ)`)
	motorcycleHeaderRegex = regexp.MustCompile(`(?i)รถจักรยานยนต์`)
	pageSeparatorRegex    = regexp.MustCompile(`\f`)
)

type ParseState int

const (
	ExpectingModel ParseState = iota
	ExpectingYear
	ExpectingPrice
)

// --- Helper Functions ---
func cleanPriceString(priceStr string) string {
	return cleanRegex.ReplaceAllString(priceStr, "")
}
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
func parsePriceRange(priceStr string) (int64, int64, error) {
	if !priceRegex.MatchString(priceStr) {
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
	maxPrice, err := strconv.ParseInt(parts[len(parts)-1], 10, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid max price '%s': %w", parts[len(parts)-1], err)
	}
	if minPrice > maxPrice {
		log.Printf("Swapping prices for line '%s': min=%d, max=%d", priceStr, minPrice, maxPrice)
		return maxPrice, minPrice, nil
	}
	return minPrice, maxPrice, nil
}

// --- Extract Function ---
// ExtractMarketPricesFromPDF extracts data from a PDF file using pdftotext
// and returns the parsed data as a slice of MarketPrice.
func (s *ExtractionService) ExtractMarketPricesFromPDF(ctx context.Context, filePath string) ([]MarketPrice, error) {
	log.Printf("Starting market price extraction from PDF: %s", filePath)

	// 1. Execute pdftotext
	cmd := exec.CommandContext(ctx, "pdftotext", filePath, "-")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	runErr := cmd.Run()
	if runErr != nil {
		log.Printf("pdftotext error output: %s", stderr.String())
		return nil, fmt.Errorf("failed to run pdftotext command: %w\nstderr: %s", runErr, stderr.String())
	}
	log.Println("pdftotext command executed successfully.")
	fullText := out.String()

	// 2. Parse the text output
	var allPrices []MarketPrice
	var currentBrand string
	currentPage := 1
	currentState := ExpectingModel
	var tempModel string
	var tempYearStart, tempYearEnd int
	lines := strings.Split(fullText, "\n")

	for lineNum, line := range lines {
		if pageSeparatorRegex.MatchString(line) {
			currentPage++
			currentState = ExpectingModel
			tempModel = ""
			continue
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if currentPage < 8 {
			continue
		} // Adjust page skip if needed
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
		if currentBrand == "" {
			continue
		}
		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			if currentState != ExpectingModel {
				log.Printf("Page ~%d, Line %d: Resetting state due to skip line: %s", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
			continue
		}
		carMatches := dataRegex.FindStringSubmatch(line)
		if len(carMatches) == 4 {
			modelTrim := strings.TrimSpace(carMatches[1])
			yearStr := strings.TrimSpace(carMatches[2])
			priceStr := strings.TrimSpace(carMatches[3])
			originalModelYearPart := strings.TrimSpace(carMatches[1]) + " " + yearStr
			if strings.HasSuffix(originalModelYearPart, " "+yearStr) {
				potentialModel := strings.TrimSuffix(originalModelYearPart, " "+yearStr)
				if len(potentialModel) > 0 && !yearRegex.MatchString(potentialModel) {
					modelTrim = strings.TrimSpace(potentialModel)
				}
			}
			if modelTrim != "" {
				yearStart, yearEnd, errYear := parseYearRange(yearStr)
				priceMin, priceMax, errPrice := parsePriceRange(priceStr)
				if errYear == nil && errPrice == nil {
					now := time.Now()
					marketPrice := MarketPrice{Brand: currentBrand, ModelTrim: modelTrim, YearStart: yearStart, YearEnd: yearEnd, PriceMin: priceMin, PriceMax: priceMax, CreatedAt: now, UpdatedAt: now}
					allPrices = append(allPrices, marketPrice)
					currentState = ExpectingModel
					tempModel = ""
					continue
				} else {
					log.Printf("Page ~%d, Line %d: Single-line regex matched but parsing failed (YearErr: %v, PriceErr: %v): %s", currentPage, lineNum+1, errYear, errPrice, line)
				}
			} else {
				log.Printf("Page ~%d, Line %d: Single-line regex matched but extracted empty modelTrim: %s", currentPage, lineNum+1, line)
			}
		}
		switch currentState {
		case ExpectingModel:
			if yearRegex.MatchString(line) || priceRegex.MatchString(line) {
				log.Printf("Page ~%d, Line %d: WARNING - Expected model, but line looks like year/price. Skipping line: %s", currentPage, lineNum+1, line)
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
				log.Printf("Page ~%d, Line %d: Expected year, got '%s'. Appending to model and expecting year again.", currentPage, lineNum+1, line)
				tempModel += " " + line
			}
		case ExpectingPrice:
			priceMin, priceMax, errPrice := parsePriceRange(line)
			if errPrice == nil {
				now := time.Now()
				marketPrice := MarketPrice{Brand: currentBrand, ModelTrim: tempModel, YearStart: tempYearStart, YearEnd: tempYearEnd, PriceMin: priceMin, PriceMax: priceMax, CreatedAt: now, UpdatedAt: now}
				allPrices = append(allPrices, marketPrice)
				currentState = ExpectingModel
				tempModel = ""
			} else {
				log.Printf("Page ~%d, Line %d: WARNING - Expected price, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
		}
	}
	log.Printf("PDF parsing finished. Found %d records.", len(allPrices))
	return allPrices, nil
}

// --- Commit Function ---
// CommitMarketPrices takes a slice of MarketPrice data and upserts it into the database.
func (s *ExtractionService) CommitMarketPrices(ctx context.Context, pricesToCommit []MarketPrice) (insertedCount int, updatedCount int, err error) {
	if len(pricesToCommit) == 0 {
		log.Println("No records received to commit.")
		return 0, 0, nil
	}

	log.Printf("Starting database commit for %d market price records...", len(pricesToCommit))

	// --- Database Operation (UPSERT) ---
	stmt, prepErr := s.db.PrepareContext(ctx, `
		INSERT INTO market_price (brand, model_trim, year_start, year_end, price_min_thb, price_max_thb, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (brand, model_trim, year_start, year_end)
		DO UPDATE SET
			price_min_thb = EXCLUDED.price_min_thb,
			price_max_thb = EXCLUDED.price_max_thb,
			updated_at = EXCLUDED.updated_at
		RETURNING (xmax = 0) AS inserted;
	`)
	if prepErr != nil {
		err = fmt.Errorf("failed to prepare upsert statement: %w", prepErr)
		return
	}
	defer stmt.Close()

	tx, txErr := s.db.BeginTx(ctx, nil)
	if txErr != nil {
		err = fmt.Errorf("failed to begin transaction: %w", txErr)
		return
	}
	// Defer function for Rollback/Commit
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p) // Re-throw panic after Rollback
		} else if err != nil {
			log.Printf("Rolling back transaction due to error: %v", err)
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Printf("Error during transaction rollback: %v", rollbackErr)
				err = fmt.Errorf("original error: %w; rollback error: %v", err, rollbackErr)
			}
		} else {
			commitErr := tx.Commit()
			if commitErr != nil {
				log.Printf("Error committing transaction: %v", commitErr)
				insertedCount = 0 // Reset counts on commit error
				updatedCount = 0
				err = fmt.Errorf("failed to commit transaction: %w", commitErr)
			} else {
				log.Println("Transaction committed successfully.")
			}
		}
	}() // End of deferred function

	txStmt := tx.StmtContext(ctx, stmt)
	now := time.Now() // Use a consistent timestamp for all updates in this batch

	for i, price := range pricesToCommit {
		var inserted bool
		// Use 'now' for created_at and updated_at for consistency during commit
		scanErr := txStmt.QueryRowContext(ctx,
			price.Brand, price.ModelTrim, price.YearStart, price.YearEnd,
			price.PriceMin, price.PriceMax, now, now, // Use consistent 'now'
		).Scan(&inserted)

		if scanErr != nil {
			recordJson, _ := json.Marshal(price) // Log the problematic record
			log.Printf("Failed to upsert record #%d [%s]: %v", i+1, string(recordJson), scanErr)
			err = fmt.Errorf("failed to upsert record #%d (%s %s %d-%d): %w",
				i+1, price.Brand, price.ModelTrim, price.YearStart, price.YearEnd, scanErr)
			return // Exit loop and trigger rollback via defer
		}

		if inserted {
			insertedCount++
		} else {
			updatedCount++
		}
	}

	log.Printf("Database commit loop completed. Inserted: %d, Updated: %d", insertedCount, updatedCount)
	// err is nil here if loop completed, commit happens in defer
	return
}

// --- Fetch All Market Prices ---
// GetAllMarketPrices retrieves all market prices from the database.
func (s *ExtractionService) GetAllMarketPrices(ctx context.Context) ([]MarketPrice, error) {
	log.Println("Fetching all market prices from database...")

	query := `
		SELECT brand, model_trim, year_start, year_end, price_min_thb, price_max_thb, created_at, updated_at
		FROM market_price
		ORDER BY brand, model_trim, year_start, year_end
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query market prices: %w", err)
	}
	defer rows.Close()

	var prices []MarketPrice
	for rows.Next() {
		var price MarketPrice
		err := rows.Scan(
			&price.Brand,
			&price.ModelTrim,
			&price.YearStart,
			&price.YearEnd,
			&price.PriceMin,
			&price.PriceMax,
			&price.CreatedAt,
			&price.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan market price row: %w", err)
		}
		prices = append(prices, price)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating market price rows: %w", err)
	}

	log.Printf("Successfully fetched %d market prices from database.", len(prices))
	return prices, nil
}

// --- Original Import Function (Calls Extract then Commit) ---
// ImportMarketPricesFromPDF extracts data and upserts into the database.
func (s *ExtractionService) ImportMarketPricesFromPDF(ctx context.Context, filePath string) (insertedCount int, updatedCount int, err error) {
	log.Printf("Starting market price import (Extraction + DB) from PDF: %s", filePath)
	allPrices, extractErr := s.ExtractMarketPricesFromPDF(ctx, filePath)
	if extractErr != nil {
		err = fmt.Errorf("extraction failed during import: %w", extractErr)
		return
	}
	if len(allPrices) == 0 {
		log.Println("No records found in PDF to import.")
		return 0, 0, nil
	}
	// Delegate DB operation to the new function
	return s.CommitMarketPrices(ctx, allPrices)
}
