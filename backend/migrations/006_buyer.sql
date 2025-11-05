package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
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
	Brand    string    `json:"brand"`
	Model    string    `json:"model"`
	SubModel string    `json:"sub_model"`
	YearStart int       `json:"year_start"`
	YearEnd   int       `json:"year_end"`
	PriceMin  int64     `json:"price_min_thb"`
	PriceMax  int64     `json:"price_max_thb"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// --- Service Struct and Constructor ---
type ExtractionService struct {
	db *sql.DB
}

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
	"JAECOO": true, "JAGUAR": true, "JEEP": true, "KIA": true,
	"LAMBORGHINI": true, "LAND ROVER": true, "LEAPMOTOR": true, "LEXUS": true, "LOTUS": true,
	"MASERATI": true, "MAZDA": true, "MCLAREN": true, "MERCEDES BENZ": true, "MG": true,
	"MINI": true, "MITSUBISHI": true, "MITSUOKA": true, "NAZA": true, "NETA": true,
	"NISSAN": true, "OMODA": true, "OPEL": true, "ORA": true, "PEUGEOT": true,
	"PORSCHE": true, "PROTON": true, "RANGE ROVER": true, "RIDDARA": true, "ROLLS-ROYCE": true,
	"ROVER": true, "SAAB": true, "SEAT": true, "SKODA": true, "SSANGYONG": true,
	"SUBARU": true, "SUZUKI": true, "TATA": true, "TESLA": true, "THAIRUNG": true,
	"TOYOTA": true, "VOLKSWAGEN": true, "VOLVO": true, "WULING": true, "XPENG": true,
	"ZEEKR": true,
	"AJ": true, "APRILIA": true, "ARIIC": true, "BAJAJ": true, "BENELLI": true,
	"CFMOTO": true, "DECO": true, "DUCATI": true, "EM": true, "GPX": true, "H SEM": true,
	"HAONAIQI": true, "HARLEY DAVIDSON": true, "HUSQVARNA": true, "INDIAN": true,
	"JRD": true, "KAVALLO": true, "KAWASAKI": true, "KTM": true, "LAMBRETTA": true, "LION": true,
	"M-BIKE": true, "MOTO GUZZI": true, "MV AGUSTA": true, "PIAGGIO": true,
	"PLATINUM": true, "ROYAL ENFIELD": true, "RYUKA": true, "SCOMADI": true, "SOLAR": true,
	"STALLIONS": true, "SYM": true, "TIGER": true, "TRIUMPH": true,
	"VESPA": true, "YAMAHA": true,
}

var junkSet = map[string]bool{
	"SPORTBACK":           true,
	"SERIES 1":            true,
	"SERIES 2":            true,
	"SERIES 3":            true,
	"SERIES 4":            true,
	"SERIES 5":            true,
	"SERIES 6":            true,
	"SERIES 7":            true,
	"SERIES 8":            true,
	"M SERIES":            true,
	"X1 SERIES":           true,
	"X2 SERIES":           true,
	"X3 SERIES":           true,
	"X4 SERIES":           true,
	"X5 SERIES":           true,
	"X6 SERIES":           true,
	"X7 SERIES":           true,
	"XM SERIES":           true,
	"Z SERIES":            true,
	"I SERIES":            true,
	"IX SERIES":           true,
	"HATCH 3 DOOR":        true,
	"HATCH 5 DOOR":        true,
	"COUPE":               true,
	"ROADSTER":            true,
	"CONVERTIBLE":         true,
	"CLUBMAN":             true,
	"COUNTRYMΑΝ":          true,
	"JOHN COOPER WORKS (JCW)": true,
	"C-SERIES":            true,
	"EX-SERIES":           true,
	"S-SERIES":            true,
	"V-SERIES":            true,
	"XC-SERIES":           true,
	// (เพิ่มคำอื่นๆ ที่เป็น Junk ที่นี่)
}

var (
	dataRegex             = regexp.MustCompile(`^(.+?)\s+(\d{4}\s*-\s*\d{4})\s+(.+)$`)
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
	ExpectingHeaderOrSubModel ParseState = iota // (State 0)
	ExpectingYearOrSubModel                 // (State 1)
	ExpectingPrice                          // (State 2)
	ExpectingYear                           // (State 3)
)

// --- Helper Functions ---
// (No changes to helper functions)
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
func (s *ExtractionService) ExtractMarketPricesFromPDF(ctx context.Context, filePath string) ([]MarketPrice, error) {
	log.Printf("Starting market price extraction from PDF: %s", filePath)

	// ... (pdftotext execution) ...
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

	var allPrices []MarketPrice
	var tempPrices []MarketPrice // <-- **FIX 1: Add temp buffer**
	var currentBrand string
	var currentModel string
	currentPage := 1
	currentState := ExpectingHeaderOrSubModel
	var tempSubModel string
	var tempLine string
	var tempYearStart, tempYearEnd int
	lines := strings.Split(fullText, "\n")

	for lineNum, line := range lines {
		// ... (Page separator, trim, blank line, page skip checks) ...
		if pageSeparatorRegex.MatchString(line) {
			currentPage++
			currentState = ExpectingHeaderOrSubModel
			tempSubModel = ""
			tempLine = ""
			continue
		}
		line = strings.TrimSpace(line)
		line = strings.Trim(line, ",")
		if line == "" {
			continue
		}
		if currentPage < 8 {
			continue
		}

		// ... (Brand check) ...
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

			// <-- **FIX 2: Flush tempPrices when brand is found**
			if len(tempPrices) > 0 {
				log.Printf("Page ~%d: Brand '%s' found. Flushing %d pending records.", currentPage, currentBrand, len(tempPrices))
				for i := range tempPrices {
					tempPrices[i].Brand = currentBrand
					
					// **Apply AION/TESLA logic here**
					if tempPrices[i].Model == "" {
						tempPrices[i].Model = tempPrices[i].SubModel
						tempPrices[i].SubModel = ""
					} else if strings.EqualFold(tempPrices[i].Model, tempPrices[i].SubModel) {
						tempPrices[i].SubModel = ""
					}
				}
				allPrices = append(allPrices, tempPrices...)
				tempPrices = nil // Clear the temp buffer
			}
			// <-- **End FIX 2**

			currentState = ExpectingHeaderOrSubModel
			tempSubModel = ""
			tempLine = ""
			currentModel = "" // Reset model when brand changes
			continue
		}

		// <-- **FIX 3: Remove the `if currentBrand == ""` check**
		// (Original check was here, now removed)

		// ... (Header/Skip check) ...
		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			if currentState != ExpectingHeaderOrSubModel {
				log.Printf("Page ~%d, Line %d: Resetting state due to skip line: %s", currentPage, lineNum+1, line)
				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			}
			continue
		}

		// --- V14: (V13 Logic) ---

		// Rule 1: "มีครบทั้งหมด" (Has everything) -> SubModel
		carMatches := dataRegex.FindStringSubmatch(line)
		if len(carMatches) == 4 {
			extractedSubModel := strings.TrimSpace(carMatches[1])
			yearStr := strings.TrimSpace(carMatches[2])
			priceStr := strings.TrimSpace(carMatches[3])

			yearStart, yearEnd, errYear := parseYearRange(yearStr)
			priceMin, priceMax, errPrice := parsePriceRange(priceStr)

			if extractedSubModel != "" && errYear == nil && errPrice == nil {
				now := time.Now()

				finalModel := currentModel
				if tempLine != "" {
					if _, isJunk := junkSet[tempLine]; !isJunk {
						finalModel = tempLine
						currentModel = tempLine // ตั้งค่า Model Header ถาวร
					} else {
						log.Printf("Page ~%d, Line %d: (Junk Case) Discarding Junk Header '%s' before dataRegex.", currentPage, lineNum+1, tempLine)
					}
					tempLine = ""
				}

				finalSubModel := extractedSubModel

				// **NOTE:** We create the struct first.
				// The AION/AUDI logic is applied *conditionally*
				marketPrice := MarketPrice{
					Brand:     currentBrand,  // Might be ""
					Model:     finalModel,    // Might be ""
					SubModel:  finalSubModel, // Will have value
					YearStart: yearStart,
					YearEnd:   yearEnd,
					PriceMin:  priceMin,
					PriceMax:  priceMax,
					CreatedAt: now,
					UpdatedAt: now,
				}

				// <-- **FIX 4: Decide where to save the record**
				if currentBrand == "" {
					// Brand not found yet (e.g., TESLA page), hold in temp buffer
					tempPrices = append(tempPrices, marketPrice)
				} else {
					// Brand is known (e.g., AUDI page), apply logic *now* and save
					if marketPrice.Model == "" {
						// AION Case (No Model Header)
						marketPrice.Model = marketPrice.SubModel
						marketPrice.SubModel = ""
					} else if strings.EqualFold(marketPrice.Model, marketPrice.SubModel) {
						// AUDI A3 ... A3 Case
						marketPrice.SubModel = ""
					}
					allPrices = append(allPrices, marketPrice)
				}
				// <-- **End FIX 4**

				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
				continue // จบการทำงานสำหรับบรรทัดนี้
			}
		}

		// --- V14: MULTI-LINE PARSER (V13 Logic) ---
		switch currentState {
		case ExpectingHeaderOrSubModel: // (State 0)
			if yearRegex.MatchString(line) || priceRegex.MatchString(line) {
				log.Printf("Page ~%d, Line %d: WARNING - Expected header/sub-model, got year/price. Skipping: %s", currentPage, lineNum+1, line)
			} else {
				tempLine = line
				currentState = ExpectingYearOrSubModel
				log.Printf("Page ~%d, Line %d: Got ambiguous text: '%s'. Waiting for next line.", currentPage, lineNum+1, tempLine)
			}

		case ExpectingYearOrSubModel: // (State 1)
			if yearRegex.MatchString(line) {
				yearStart, yearEnd, errYear := parseYearRange(line)
				if errYear == nil {
					tempSubModel = tempLine // "AION ES" or "S3 SPORTBACK"
					tempYearStart = yearStart
					tempYearEnd = yearEnd
					currentState = ExpectingPrice
					log.Printf("Page ~%d, Line %d: (Multi-line) '%s' was SubModel-L1. Got Year. Waiting for Price. (Current Header: '%s')", currentPage, lineNum+1, tempSubModel, currentModel)
				}
			} else if !priceRegex.MatchString(line) {
				if _, isJunk := junkSet[tempLine]; isJunk {
					log.Printf("Page ~%d, Line %d: (Junk Case) Discarding Junk Header: '%s'. Retrying with '%s'.", currentPage, lineNum+1, tempLine, line)
					tempLine = line 
					currentState = ExpectingYearOrSubModel
				} else {
					currentModel = tempLine
					tempSubModel = line 
					currentState = ExpectingYear
					log.Printf("Page ~%d, Line %d: (AUDI Case) '%s' was Model Header. Set SubModel-L1: '%s'. Waiting for Year.", currentPage, lineNum+1, currentModel, tempSubModel)
				}

			} else {
				log.Printf("Page ~%d, Line %d: WARNING - Expected year or text, got price. Resetting: %s", currentPage, lineNum+1, line)
				currentState = ExpectingHeaderOrSubModel
				tempLine = ""
				tempSubModel = ""
			}

		case ExpectingYear: // (State 3)
			yearStart, yearEnd, errYear := parseYearRange(line)
			if errYear == nil {
				tempYearStart = yearStart
				tempYearEnd = yearEnd
				currentState = ExpectingPrice
			} else {
				log.Printf("Page ~%d, Line %d: Expected year, got '%s'. Appending to sub-model.", currentPage, lineNum+1, line)
				tempSubModel += " " + line
			}

		case ExpectingPrice: // (State 2)
			priceMin, priceMax, errPrice := parsePriceRange(line)
			if errPrice == nil {
				now := time.Now()
				extractedSubModel := tempSubModel

				finalModel := currentModel
				finalSubModel := extractedSubModel

				marketPrice := MarketPrice{
					Brand:     currentBrand,  // Might be ""
					Model:     finalModel,    // Might be ""
					SubModel:  finalSubModel, // Will have value
					YearStart: tempYearStart,
					YearEnd:   tempYearEnd,
					PriceMin:  priceMin,
					PriceMax:  priceMax,
					CreatedAt: now,
					UpdatedAt: now,
				}
				
				// <-- **FIX 5: Decide where to save the record**
				if currentBrand == "" {
					// Brand not found yet (e.g., AION page), hold in temp buffer
					tempPrices = append(tempPrices, marketPrice)
				} else {
					// Brand is known (e.g., AUDI page), apply logic *now* and save
					if marketPrice.Model == "" {
						// AION Case (No Model Header)
						marketPrice.Model = marketPrice.SubModel
						marketPrice.SubModel = ""
					} else if strings.EqualFold(marketPrice.Model, marketPrice.SubModel) {
						// AUDI A3 ... A3 Case
						marketPrice.SubModel = ""
					}
					allPrices = append(allPrices, marketPrice)
				}
				// <-- **End FIX 5**

				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			} else {
				log.Printf("Page ~%d, Line %d: WARNING - Expected price, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			}
		} // --- End Switch
	} // --- End For Loop

	// **FIX 6: Final check in case EOF is reached with pending items**
	// (This might happen if the *very last* page has brand-at-bottom)
	if len(tempPrices) > 0 {
		log.Printf("EOF reached. Flushing %d pending records. (This might indicate a missing Brand on the last page)", len(tempPrices))
		log.Printf("WARNING: %d records were parsed but no brand was found for them (likely from the last page). Discarding.", len(tempPrices))
	}

	log.Printf("PDF parsing finished. Found %d records.", len(allPrices))
	return allPrices, nil
}

func (s *ExtractionService) CommitMarketPrices(ctx context.Context, pricesToCommit []MarketPrice) (insertedCount int, updatedCount int, err error) {
	if len(pricesToCommit) == 0 {
		log.Println("No records received to commit.")
		return 0, 0, nil
	}
	log.Printf("Starting database commit for %d market price records...", len(pricesToCommit))
	stmt, prepErr := s.db.PrepareContext(ctx, `
		INSERT INTO market_price (brand, model, sub_model, year_start, year_end, price_min_thb, price_max_thb, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (brand, model, sub_model, year_start, year_end)
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
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
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
				insertedCount = 0
				updatedCount = 0
				err = fmt.Errorf("failed to commit transaction: %w", commitErr)
			} else {
				log.Println("Transaction committed successfully.")
			}
		}
	}()
	txStmt := tx.StmtContext(ctx, stmt)
	now := time.Now()
	for i, price := range pricesToCommit {
		var inserted bool
		scanErr := txStmt.QueryRowContext(ctx,
			price.Brand, price.Model, price.SubModel, price.YearStart, price.YearEnd,
			price.PriceMin, price.PriceMax, now, now,
		).Scan(&inserted)
		if scanErr != nil {
			recordJson, _ := json.Marshal(price)
			log.Printf("Failed to upsert record #%d [%s]: %v", i+1, string(recordJson), scanErr)
			err = fmt.Errorf("failed to upsert record #%d (%s %s %s %d-%d): %w",    
				i+1, price.Brand, price.Model, price.SubModel, price.YearStart, price.YearEnd, scanErr)
			return
		}
		if inserted {
			insertedCount++
		} else {
			updatedCount++
		}
	}
	log.Printf("Database commit loop completed. Inserted: %d, Updated: %d", insertedCount, updatedCount)
	return
}

// --- Import Function ---
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
	return s.CommitMarketPrices(ctx, allPrices)
}