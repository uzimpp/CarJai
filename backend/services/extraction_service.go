package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// MarketPrice struct remains the same...
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

// brandSet remains the same...
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

// Helper functions (cleanPriceString, parseYearRange, parsePriceRange) remain the same...
func cleanPriceString(priceStr string) string { return cleanRegex.ReplaceAllString(priceStr, "") }
func parseYearRange(yearStr string) (int, int, error) { /* ... implementation ... */
	matches := yearRegex.FindStringSubmatch(yearStr)
	if len(matches) != 3 {
		return 0, 0, fmt.Errorf("invalid year format: %s", yearStr)
	}
	start, err := strconv.Atoi(matches[1])
	if err != nil { return 0, 0, fmt.Errorf("invalid start year '%s': %w", matches[1], err) }
	end, err := strconv.Atoi(matches[2])
	if err != nil { return 0, 0, fmt.Errorf("invalid end year '%s': %w", matches[2], err) }
	return start, end, nil
}
func parsePriceRange(priceStr string) (int64, int64, error) { /* ... implementation ... */
	if !priceRegex.MatchString(priceStr) { // Pre-check format
		return 0, 0, fmt.Errorf("string does not match price pattern: %s", priceStr)
	}
	priceStr = cleanPriceString(priceStr)
	var parts []string
	if strings.Contains(priceStr, " ") { parts = strings.Fields(priceStr)
	} else if strings.Contains(priceStr, "-") { parts = strings.Split(priceStr, "-")
	} else { parts = []string{priceStr} }
	var validParts []string
	for _, p := range parts { if p != "" { validParts = append(validParts, p) } }
	parts = validParts
	if len(parts) == 0 { return 0, 0, fmt.Errorf("empty price string after cleaning") }
	if len(parts) == 1 { price, err := strconv.ParseInt(parts[0], 10, 64); if err != nil { return 0, 0, fmt.Errorf("invalid single price number '%s': %w", parts[0], err) }; return price, price, nil }
	minPrice, err := strconv.ParseInt(parts[0], 10, 64); if err != nil { return 0, 0, fmt.Errorf("invalid min price '%s': %w", parts[0], err) }
	maxPrice, err := strconv.ParseInt(parts[len(parts)-1], 10, 64); if err != nil { return 0, 0, fmt.Errorf("invalid max price '%s': %w", parts[len(parts)-1], err) }
	if minPrice > maxPrice { log.Printf("Swapping prices for line '%s': min=%d, max=%d", priceStr, minPrice, maxPrice); return maxPrice, minPrice, nil }; return minPrice, maxPrice, nil
}


// ExtractAndPrintMarketPricesPOC performs PDF extraction using pdftotext (supports multi-line).
func ExtractAndPrintMarketPricesPOC(filePath string) error {
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

	// State machine variables
	currentState := ExpectingModel
	var tempModel string
	var tempYearStart, tempYearEnd int

	lines := strings.Split(fullText, "\n")

	for lineNum, line := range lines {
		if pageSeparatorRegex.MatchString(line) {
			currentPage++
			// Reset state/temps on new page to avoid carrying over partial data
			currentState = ExpectingModel
			tempModel = ""
			continue
		}

		line = strings.TrimSpace(line)
		if line == "" { continue }

		// Skip early pages (adjust threshold if needed)
		if currentPage < 8 { continue }

		// --- Check for Brand first ---
		potentialBrand := line
		// Special handling for multi-word brands split across lines (simple check)
		// e.g., "HARLEY" might be followed by "DAVIDSON"
		// This needs refinement for robustness
		if _, isBrand := brandSet[potentialBrand]; isBrand {
			// Check if the potential brand is a continuation (e.g., DAVIDSON)
			// This heuristic is basic and might misclassify
			isLikelyContinuation := strings.Contains(potentialBrand, " ") == false && len(strings.Fields(potentialBrand)) == 1
			if currentBrand != "" && isLikelyContinuation && brandSet[currentBrand+" "+potentialBrand] {
				currentBrand = currentBrand + " " + potentialBrand // Combine
				log.Printf("Page ~%d: Updated brand to: %s", currentPage, currentBrand)
			} else {
				currentBrand = potentialBrand // Set new brand
				log.Printf("Page ~%d: Switched brand to: %s", currentPage, currentBrand)
			}
			currentState = ExpectingModel // Reset state on brand change
			tempModel = ""
			continue
		}

		// Skip if no brand context yet
		if currentBrand == "" { continue }

		// Skip headers, page numbers, years
		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			// If we skip while expecting year/price, reset state
			if currentState != ExpectingModel {
				log.Printf("Page ~%d, Line %d: Resetting state due to skip line: %s", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
			}
			continue
		}

		// --- Try matching Single-Line (Car) format first ---
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
					log.Printf("Page ~%d, Line %d: Parsed single-line entry: %s", currentPage, lineNum+1, modelTrim)
					// Reset state after successful single-line match
					currentState = ExpectingModel
					tempModel = ""
					continue // Move to next line
				} else {
					log.Printf("Page ~%d, Line %d: Single-line regex matched but parsing failed (YearErr: %v, PriceErr: %v): %s", currentPage, lineNum+1, errYear, errPrice, line)
				}
			}
		}

		// --- If not single-line, process with State Machine (Motorcycle/Multi-line) ---
		switch currentState {
		case ExpectingModel:
			// If line looks like year or price, it's unexpected here
			if yearRegex.MatchString(line) || priceRegex.MatchString(line) {
				log.Printf("Page ~%d, Line %d: WARNING - Expected model, but line looks like year/price. Skipping: %s", currentPage, lineNum+1, line)
				// Don't change state, hope the next line is a model
			} else {
				// Assume it's a model name
				tempModel = line
				currentState = ExpectingYear
				// log.Printf("Page ~%d, Line %d: Got Model: %s -> Expecting Year", currentPage, lineNum+1, tempModel)
			}
		case ExpectingYear:
			yearStart, yearEnd, errYear := parseYearRange(line)
			if errYear == nil {
				// Got year successfully
				tempYearStart = yearStart
				tempYearEnd = yearEnd
				currentState = ExpectingPrice
				// log.Printf("Page ~%d, Line %d: Got Year: %s -> Expecting Price", currentPage, lineNum+1, line)
			} else {
				// Didn't get year, reset state and maybe log warning
				log.Printf("Page ~%d, Line %d: WARNING - Expected year, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
				// Consider re-processing 'line' as a potential model? For now, just reset.
			}
		case ExpectingPrice:
			priceMin, priceMax, errPrice := parsePriceRange(line)
			if errPrice == nil {
				// Got price successfully, we have a complete entry
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
				log.Printf("Page ~%d, Line %d: Parsed multi-line entry: %s", currentPage, lineNum+1, tempModel)
				// Reset for the next entry
				currentState = ExpectingModel
				tempModel = ""
			} else {
				// Didn't get price, reset state and log warning
				log.Printf("Page ~%d, Line %d: WARNING - Expected price, got '%s'. Resetting state.", currentPage, lineNum+1, line)
				currentState = ExpectingModel
				tempModel = ""
				// Consider re-processing 'line' as a potential model? For now, just reset.
			}
		} // end switch
	} // end line loop

	log.Printf("Successfully extracted %d records.", len(allPrices))
	jsonData, err := json.MarshalIndent(allPrices, "", "  ")
	if err != nil { return fmt.Errorf("failed to marshal JSON: %w", err) }
	fmt.Println(string(jsonData))
	return nil
}

/* // Placeholder... */