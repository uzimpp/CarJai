package services

import (
	"bytes" // Needed for capturing command output
	"encoding/json"
	"fmt"
	"log"
	"os/exec" // Needed to run external command
	"regexp"
	"strconv"
	"strings"
	"time"

	// pdfLib "github.com/ledongthuc/pdf" // No longer needed
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

// Regex definitions remain the same...
var (
	dataRegex             = regexp.MustCompile(`^(.+?)\s+(\d{4}-\d{4})\s+(.+)$`)
	cleanRegex            = regexp.MustCompile(`[,\$]`)
	skipLineRegex         = regexp.MustCompile(`^(\d{1,3}|\d{4})$`) // Keep this for skipping page numbers in text output
	headerRegex           = regexp.MustCompile(`(?i)(แบบ\s*/\s*รุ่น|ปีผลิต|ราคาประเมิน|สารบัญ)`)
	motorcycleHeaderRegex = regexp.MustCompile(`(?i)รถจักรยานยนต์`)
	// Regex to detect form feed character which often separates pages in pdftotext output
	pageSeparatorRegex = regexp.MustCompile(`\f`)
)

// Helper functions (cleanPriceString, parseYearRange, parsePriceRange) remain the same...
func cleanPriceString(priceStr string) string { return cleanRegex.ReplaceAllString(priceStr, "") }
func parseYearRange(yearStr string) (int, int, error) { /* ... implementation ... */
	parts := strings.Split(yearStr, "-")
	if len(parts) != 2 { return 0, 0, fmt.Errorf("invalid year format: %s", yearStr) }
	start, err := strconv.Atoi(parts[0])
	if err != nil { return 0, 0, fmt.Errorf("invalid start year '%s': %w", parts[0], err) }
	end, err := strconv.Atoi(parts[1])
	if err != nil { return 0, 0, fmt.Errorf("invalid end year '%s': %w", parts[1], err) }
	return start, end, nil
}
func parsePriceRange(priceStr string) (int64, int64, error) { /* ... implementation ... */
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


// ExtractAndPrintMarketPricesPOC performs PDF extraction using pdftotext.
func ExtractAndPrintMarketPricesPOC(filePath string) error {
	log.Printf("Attempting to extract text using pdftotext from: %s", filePath)

	// Command: pdftotext <filePath> -
	// The '-' tells pdftotext to output to stdout instead of a file
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

	// --- Parsing Logic (Applied to the full text output) ---
	var allPrices []MarketPrice
	var currentBrand string
	parsingMotorcycles := false
	currentPage := 1 // Keep track roughly

	// Split the output into lines
	lines := strings.Split(fullText, "\n")

	for lineNum, line := range lines {
		// Check for page separator character (\f)
		if pageSeparatorRegex.MatchString(line) {
			currentPage++
			// Reset brand context if needed, depending on PDF layout
			// currentBrand = "" // Optional: Reset brand on new page?
			continue
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Skip pages before actual data (heuristic based on page number)
		// This is less precise than the previous page loop, adjust if necessary
		if currentPage < 8 {
			continue
		}


		if motorcycleHeaderRegex.MatchString(line) {
			log.Printf("Detected motorcycle section around page %d. Stopping car data extraction.", currentPage)
			parsingMotorcycles = true
			// break // Can break here if motorcycle data is reliably at the end
		}
		if parsingMotorcycles {
			continue // Skip motorcycle lines
		}

		potentialBrand := line
		if _, isBrand := brandSet[potentialBrand]; isBrand {
			currentBrand = potentialBrand
			log.Printf("Page ~%d: Switched brand to: %s", currentPage, currentBrand)
			continue
		}

		if currentBrand == "" {
			continue
		}

		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			continue
		}

		matches := dataRegex.FindStringSubmatch(line)
		if len(matches) == 4 {
			modelTrim := strings.TrimSpace(matches[1])
			yearStr := matches[2]
			priceStr := strings.TrimSpace(matches[3])

			modelTrim = strings.TrimSuffix(modelTrim, yearStr)
			modelTrim = strings.TrimSpace(modelTrim)

			if modelTrim == "" {
				log.Printf("Page ~%d, Line %d: Skipping line (empty model after cleaning): %s", currentPage, lineNum+1, line)
				continue
			}

			yearStart, yearEnd, err := parseYearRange(yearStr)
			if err != nil {
				log.Printf("Page ~%d, Line %d: Skipping line (bad year format '%s'): %s", currentPage, lineNum+1, yearStr, line)
				continue
			}

			priceMin, priceMax, err := parsePriceRange(priceStr)
			if err != nil {
				log.Printf("Page ~%d, Line %d: Skipping line (bad price format '%s'): %s", currentPage, lineNum+1, priceStr, line)
				continue
			}

			now := time.Now()
			marketPrice := MarketPrice{
				Brand:     currentBrand,
				ModelTrim: modelTrim,
				YearStart: yearStart,
				YearEnd:   yearEnd,
				PriceMin:  priceMin,
				PriceMax:  priceMax,
				CreatedAt: now,
				UpdatedAt: now,
			}
			allPrices = append(allPrices, marketPrice)
		} else {
			// Only log non-matching lines if they appear *after* page 8 approx.
			if currentPage >= 8 {
				log.Printf("Page ~%d, Line %d: Skipping line (no data match): %s", currentPage, lineNum+1, line)
			}
		}
	} // end line loop

	log.Printf("Successfully extracted %d records.", len(allPrices))

	jsonData, err := json.MarshalIndent(allPrices, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	fmt.Println(string(jsonData))
	return nil
}

/* // Placeholder... */