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
	Brand     string    `json:"brand"`
	Model     string    `json:"model"`
	SubModel  string    `json:"sub_model"`
	YearStart int       `json:"year_start"`
	YearEnd   int       `json:"year_end"`
	PriceMin  int64     `json:"price_min_thb"`
	PriceMax  int64     `json:"price_max_thb"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// --- V16: Add POC Response Struct ---
// Struct ใหม่สำหรับส่งข้อมูลดีบักกลับไปที่ Frontend
type ExtractionPOCResponse struct {
	DetectedHeaders []string      `json:"detected_headers"` // เก็บ Model Headers ที่เจอ
	DebugLog        []string      `json:"debug_log"`        // เก็บ Log การตัดสินใจ
	FinalPrices     []MarketPrice `json:"final_prices"`     // เก็บผลลัพธ์ (ของเดิม)
}

// --- Service Struct and Constructor ---
type ExtractionService struct {
	db *sql.DB
}

func NewExtractionService(db *sql.DB) *ExtractionService {
	return &ExtractionService{db: db}
}

// --- Constants and Variables ---
// (No changes to brandSet, junkSet, or regex variables)
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
	"NISSAN": true, "OMODA": true, "OPEL": true, "ORA": true, "PEEUGEOT": true, // หมายเหตุ: PEEUGEOT สะกดผิดในต้นฉบับ
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
	"SPORTBACK": true, "SERIES 1": true, "SERIES 2": true, "SERIES 3": true, "SERIES 4": true,
	"SERIES 5": true, "SERIES 6": true, "SERIES 7": true, "SERIES 8": true, "M SERIES": true,
	"X1 SERIES": true, "X2 SERIES": true, "X3 SERIES": true, "X4 SERIES": true, "X5 SERIES": true,
	"X6 SERIES": true, "X7 SERIES": true, "XM SERIES": true, "Z SERIES": true, "I SERIES": true,
	"IX SERIES": true, "HATCH 3 DOOR": true, "HATCH 5 DOOR": true, "COUPE": true,
	"ROADSTER": true, "CONVERTIBLE": true, "CLUBMAN": true, "COUNTRYMΑΝ": true,
	"JOHN COOPER WORKS (JCW)": true, "C-SERIES": true, "EX-SERIES": true, "S-SERIES": true,
	"V-SERIES": true, "XC-SERIES": true,
}
// --- V17 FIX: เพิ่ม Set สำหรับ Brand ที่ไม่มีการแยกรุ่นย่อย ---
var singleModelBrands = map[string]bool{
	"AION": true, "TESLA": true, "NETA": true, "XPENG": true, "ZEEKR": true, "LEAPMOTOR": true,
	"AVATR": true, "DEEPAL": true, "DENZA": true, "ORA": true,
	// (เพิ่ม Brand อื่นๆ ที่มีโครงสร้าง Model/SubModel แบบเดียวกับ AION ได้ที่นี่)
}
// --- END V17 FIX ---

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
	ExpectingHeaderOrSubModel ParseState = iota
	ExpectingYearOrSubModel
	ExpectingPrice
	ExpectingYear
)

// --- Helper Functions ---
// (No changes to helper functions: cleanPriceString, parseYearRange, parsePriceRange)
func cleanPriceString(priceStr string) string { return cleanRegex.ReplaceAllString(priceStr, "") }
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
		return maxPrice, minPrice, nil
	}
	return minPrice, maxPrice, nil
}

// --- V17 FIX: เพิ่มฟังก์ชัน Helper สำหรับแยก Model/SubModel ---
func splitModelSubModel(fullSubModel string, brand string) (string, string) {
	// 1. ตรวจสอบ Brand ที่ไม่ต้องแยก (AION, TESLA, etc.)
	if _, isSingleModel := singleModelBrands[brand]; isSingleModel {
		return fullSubModel, "" // e.g., Model: "AION ES", SubModel: ""
	}

	// 2. Logic การแยกแบบปกติ (สำหรับ AUDI, BMW, etc.)
	parts := strings.Fields(fullSubModel)
	if len(parts) <= 1 {
		return fullSubModel, "" // e.g., "A3" -> Model: "A3", SubModel: ""
	}

	// 3. Logic การแยก: คำแรกคือ Model ที่เหลือคือ SubModel
	// "A1 1.4" -> "A1", "1.4"
	// "X2 SDRIVE 20I (F39)" -> "X2", "SDRIVE 20I (F39)"
	// "D-MAX (SPACE CAB)" -> "D-MAX", "(SPACE CAB)"
	return parts[0], strings.Join(parts[1:], " ")
}

// --- END V17 FIX ---

// --- Extract Function (V16: Modified for POC) ---
// V16: เปลี่ยน return type เป็น (ExtractionPOCResponse, error)
func (s *ExtractionService) ExtractMarketPricesFromPDF(ctx context.Context, filePath string) (ExtractionPOCResponse, error) {
	log.Printf("Starting market price extraction from PDF: %s", filePath)

	// V16: สร้าง Struct ที่จะส่งกลับ
	var pocResponse ExtractionPOCResponse
	pocResponse.DebugLog = append(pocResponse.DebugLog, "Extraction service started.")

	cmd := exec.CommandContext(ctx, "pdftotext", filePath, "-")
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	runErr := cmd.Run()
	if runErr != nil {
		log.Printf("pdftotext error output: %s", stderr.String())
		return pocResponse, fmt.Errorf("failed to run pdftotext command: %w\nstderr: %s", runErr, stderr.String())
	}
	log.Println("pdftotext command executed successfully.")
	fullText := out.String()

	var tempPrices []MarketPrice // Buffer สำหรับ Brand ที่อยู่ท้ายหน้า
	var currentBrand string
	var currentModel string // V17: ตัวแปรนี้จะถูกใช้โดย (Junk) State 1->3 เท่านั้น
	currentPage := 1
	currentState := ExpectingHeaderOrSubModel
	var tempSubModel string
	var tempLine string
	var tempYearStart, tempYearEnd int
	lines := strings.Split(fullText, "\n")

	for lineNum, line := range lines {
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

		// --- Brand check ---
		potentialBrand := line
		if _, isBrand := brandSet[potentialBrand]; isBrand {
			// (Logic การรวม Brand เช่น LAND ROVER ไม่เปลี่ยนแปลง)
			isLikelyContinuation := !strings.Contains(potentialBrand, " ") && len(strings.Fields(potentialBrand)) == 1
			if currentBrand != "" && isLikelyContinuation && brandSet[currentBrand+" "+potentialBrand] {
				currentBrand = currentBrand + " " + potentialBrand
			} else {
				currentBrand = potentialBrand
			}

			debugMsg := fmt.Sprintf("Page ~%d: Switched brand to: %s", currentPage, currentBrand)
			pocResponse.DebugLog = append(pocResponse.DebugLog, debugMsg)

			// --- V16 FIX (Hold-and-Flush Logic) ---
			if len(tempPrices) > 0 {
				flushMsg := fmt.Sprintf("Page ~%d: Brand '%s' found. Flushing %d pending records.", currentPage, currentBrand, len(tempPrices))
				pocResponse.DebugLog = append(pocResponse.DebugLog, flushMsg)

				for i := range tempPrices {
					tempPrices[i].Brand = currentBrand // 1. ตั้ง Brand

					// --- V17 FIX: ใช้ Logic แยกใหม่ ที่นี่ ---
					// tempPrices[i].SubModel ยังคงเป็น "AION ES" หรือ "A1 1.4"
					finalModel, finalSubModel := splitModelSubModel(tempPrices[i].SubModel, currentBrand)
					tempPrices[i].Model = finalModel
					tempPrices[i].SubModel = finalSubModel
					// --- END V17 FIX ---

					pocResponse.FinalPrices = append(pocResponse.FinalPrices, tempPrices[i])
				}
				tempPrices = nil // Clear the temp buffer
			}
			// --- End V16 FIX ---

			currentState = ExpectingHeaderOrSubModel
			tempSubModel = ""
			tempLine = ""
			currentModel = "" // Reset model when brand changes
			continue
		}

		if headerRegex.MatchString(line) || skipLineRegex.MatchString(line) {
			if currentState != ExpectingHeaderOrSubModel {
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: Resetting state due to skip line: %s", currentPage, lineNum+1, line))
				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			}
			continue
		}

		// --- Rule 1: "มีครบทั้งหมด" (dataRegex) ---
		carMatches := dataRegex.FindStringSubmatch(line)
		if len(carMatches) == 4 {
			extractedSubModel := strings.TrimSpace(carMatches[1])
			yearStr := strings.TrimSpace(carMatches[2])
			priceStr := strings.TrimSpace(carMatches[3])

			yearStart, yearEnd, errYear := parseYearRange(yearStr)
			priceMin, priceMax, errPrice := parsePriceRange(priceStr)

			if extractedSubModel != "" && errYear == nil && errPrice == nil {
				now := time.Now()
				
				// V17: เราไม่ใช้ logic 'tempLine' หรือ 'finalModel' จาก 'currentModel' ที่นี่อีกแล้ว
				if tempLine != "" {
					if _, isJunk := junkSet[tempLine]; isJunk {
						pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: (Junk Case) Discarding Junk Header '%s' before dataRegex.", currentPage, lineNum+1, tempLine))
					}
					// ไม่ว่าจะเป็น Junk หรือไม่ เราก็ไม่ควรตั้งเป็น Header
					tempLine = ""
				}

				marketPrice := MarketPrice{
					Brand:     currentBrand, // อาจจะว่าง
					Model:     "",           // V17: จะถูกเขียนทับ
					SubModel:  "",           // V17: จะถูกเขียนทับ
					YearStart: yearStart,
					YearEnd:   yearEnd,
					PriceMin:  priceMin,
					PriceMax:  priceMax,
					CreatedAt: now,
					UpdatedAt: now,
				}

				// --- V17 FIX: ใช้ Logic แยกใหม่ ที่นี่ ---
				finalModelToUse, finalSubModelToUse := splitModelSubModel(extractedSubModel, currentBrand)
				marketPrice.Model = finalModelToUse
				marketPrice.SubModel = finalSubModelToUse
				// --- END V17 FIX ---

				// --- V16 FIX (Hold-and-Flush Logic) ---
				if currentBrand == "" {
					// Brand ไม่มา (TESLA), เก็บใน temp
					tempPrices = append(tempPrices, marketPrice)
				} else {
					// Brand มาแล้ว (AUDI),
					// V17: ไม่ต้องทำ Logic เพิ่ม
					pocResponse.FinalPrices = append(pocResponse.FinalPrices, marketPrice)
				}
				// --- End V16 FIX ---

				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
				continue
			}
		}

		// --- MULTI-LINE PARSER ---
		switch currentState {
		case ExpectingHeaderOrSubModel: // (State 0)
			if yearRegex.MatchString(line) || priceRegex.MatchString(line) {
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: WARNING - Expected header/sub-model, got year/price. Skipping: %s", currentPage, lineNum+1, line))
			} else {
				tempLine = line
				currentState = ExpectingYearOrSubModel
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: State 0 -> 1. Got ambiguous text: '%s'. Waiting for next line.", currentPage, lineNum+1, tempLine))
			}

		case ExpectingYearOrSubModel: // (State 1)
			if yearRegex.MatchString(line) {
				yearStart, yearEnd, errYear := parseYearRange(line)
				if errYear == nil {
					tempSubModel = tempLine // e.g., "AION ES" or "A1 1.4"
					tempYearStart = yearStart
					tempYearEnd = yearEnd
					currentState = ExpectingPrice
					// V17: เราลบ (Header: '%s') ออกจาก Log นี้ เพราะ currentModel ไม่น่าเชื่อถือ
					pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: State 1 -> 2. '%s' was SubModel-L1. Got Year. Waiting for Price.", currentPage, lineNum+1, tempSubModel))
				}
			} else if !priceRegex.MatchString(line) {
				if _, isJunk := junkSet[tempLine]; isJunk {
					pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: (Junk Case) Discarding Junk Header: '%s'. Retrying with '%s'.", currentPage, lineNum+1, tempLine, line))
					tempLine = line
					currentState = ExpectingYearOrSubModel // Back to State 1
				} else {
					// V16: นี่คือจุดที่ตรวจพบ Model Header! (V17: เรายังคงเก็บ Logic นี้ไว้สำหรับ Debugging Headers)
					currentModel = tempLine // V17: นี่คือ "Junk" Header จากสารบัญ
					tempSubModel = line
					currentState = ExpectingYear

					headerMsg := fmt.Sprintf("Page ~%d, Line %d: State 1 -> 3. (AUDI Case) '%s' was Model Header. Set SubModel-L1: '%s'. Waiting for Year.", currentPage, lineNum+1, currentModel, tempSubModel)
					pocResponse.DebugLog = append(pocResponse.DebugLog, headerMsg)
					pocResponse.DetectedHeaders = append(pocResponse.DetectedHeaders, currentModel)
				}

			} else {
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: WARNING - Expected year or text, got price. Resetting: %s", currentPage, lineNum+1, line))
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
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: State 3 -> 2. Got Year. Waiting for Price. (SubModel: '%s')", currentPage, lineNum+1, tempSubModel))
			} else {
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: State 3 -> 3. Expected year, got '%s'. Appending to sub-model.", currentPage, lineNum+1, line))
				tempSubModel += " " + line
			}

		case ExpectingPrice: // (State 2)
			priceMin, priceMax, errPrice := parsePriceRange(line)
			if errPrice == nil {
				now := time.Now()

				marketPrice := MarketPrice{
					Brand:     currentBrand,  // อาจจะว่าง
					Model:     "",            // V17: จะถูกเขียนทับ
					SubModel:  "",            // V17: จะถูกเขียนทับ
					YearStart: tempYearStart,
					YearEnd:   tempYearEnd,
					PriceMin:  priceMin,
					PriceMax:  priceMax,
					CreatedAt: now,
					UpdatedAt: now,
				}

				// --- V17 FIX: ใช้ Logic แยกใหม่ ที่นี่ ---
				// 'tempSubModel' คือ "AION ES" หรือ "A1 1.4"
				finalModel, finalSubModel := splitModelSubModel(tempSubModel, currentBrand)
				marketPrice.Model = finalModel
				marketPrice.SubModel = finalSubModel
				// --- END V17 FIX ---

				// --- V16 FIX (Hold-and-Flush Logic) ---
				if currentBrand == "" {
					// Brand ไม่มา (AION), เก็บใน temp
					tempPrices = append(tempPrices, marketPrice)
				} else {
					// Brand มาแล้ว (AUDI)
					// V17: ไม่ต้องทำ Logic เพิ่ม
					pocResponse.FinalPrices = append(pocResponse.FinalPrices, marketPrice)
				}
				// --- End V16 FIX ---

				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			} else {
				pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("Page ~%d, Line %d: WARNING - Expected price, got '%s'. Resetting state.", currentPage, lineNum+1, line))
				currentState = ExpectingHeaderOrSubModel
				tempSubModel = ""
				tempLine = ""
			}
		} // --- End Switch
	} // --- End For Loop

	log.Printf("PDF parsing finished. Found %d records.", len(pocResponse.FinalPrices))
	pocResponse.DebugLog = append(pocResponse.DebugLog, fmt.Sprintf("PDF parsing finished. Found %d records.", len(pocResponse.FinalPrices)))

	// V16: คืนค่า Struct ใหม่
	return pocResponse, nil
}

// --- Commit Function ---
// (No changes to Commit function)
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

// --- Import Function (V16: Fixed breaking change) ---
func (s *ExtractionService) ImportMarketPricesFromPDF(ctx context.Context, filePath string) (insertedCount int, updatedCount int, err error) {
	log.Printf("Starting market price import (Extraction + DB) from PDF: %s", filePath)

	// V16: รับค่าเป็น pocResponse
	pocResponse, extractErr := s.ExtractMarketPricesFromPDF(ctx, filePath)
	if extractErr != nil {
		err = fmt.Errorf("extraction failed during import: %w", extractErr)
		return
	}

	// V16: ใช้ pocResponse.FinalPrices ในการ Commit
	if len(pocResponse.FinalPrices) == 0 {
		log.Println("No records found in PDF to import.")
		return 0, 0, nil
	}
	return s.CommitMarketPrices(ctx, pocResponse.FinalPrices)
}