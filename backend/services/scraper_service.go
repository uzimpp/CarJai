// services/scraper_service.go
package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"
	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// InspectionFields represents structured data extracted from vehicle inspection
type InspectionFields struct {
	// Basic identification fields
	ChassisNumber string                 // Required - for validation
	Mileage       *int                   // Optional - most recent mileage
	Colors        []string               // Optional - up to 3 colors
	LicensePlate  *LicensePlateBreakdown // Optional - parsed license plate
	Station       *string                // Optional - inspection station name

	// Overall inspection result
	OverallPass        *bool // Optional - overall inspection pass/fail
	BrakeResult        *bool // Brake test result
	HandbrakeResult    *bool // Handbrake test result
	AlignmentResult    *bool // Wheel alignment result
	NoiseResult        *bool // Noise level result
	EmissionResult     *bool // Emissions test result
	HornResult         *bool // Horn test result
	SpeedometerResult  *bool // Speedometer result
	HighLowBeamResult  *bool // High/low beams result
	SignalLightsResult *bool // Turn/brake/plate lights result
	OtherLightsResult  *bool // Other lights result
	WindshieldResult   *bool // Windshield/windows result
	SteeringResult     *bool // Steering system result
	WheelsTiresResult  *bool // Wheels and tires result
	FuelTankResult     *bool // Fuel tank and lines result
	ChassisResult      *bool // Undercarriage/chassis result
	BodyResult         *bool // Body and frame result
	DoorsFloorResult   *bool // Doors and floor result
	SeatbeltResult     *bool // Seatbelts result
	WiperResult        *bool // Wipers result
}

// LicensePlateBreakdown represents a parsed license plate
type LicensePlateBreakdown struct {
	Prefix     string // e.g., "กข", "1กข"
	Number     string // e.g., "5177"
	ProvinceTh string // e.g., "กรุงเทพมหานคร"
}

type ScraperService struct{}

func NewScraperService() *ScraperService {
	return &ScraperService{}
}

// ScrapeInspectionData performs web scraping using a headless browser.
func (s *ScraperService) ScrapeInspectionData(url string) (map[string]string, error) {
	// 👇 [แก้ไข] เพิ่ม Options สำหรับการรันใน Docker
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true), // รันแบบไม่มีหน้าจอ
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true), // สำคัญมากสำหรับการรันใน Docker
		chromedp.Flag("disable-dev-shm-usage", true),
	)

	// สร้าง Context สำหรับ Browser instance พร้อม Options
	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	// สร้าง Tab ใหม่ใน Browser (จาก Allocator Context)
	taskCtx, cancel := chromedp.NewContext(allocCtx, chromedp.WithLogf(log.Printf))
	defer cancel()

	// ตั้งค่า Timeout ของ task
	taskCtx, cancel = context.WithTimeout(taskCtx, 30*time.Second)
	defer cancel()

	var htmlContent string
	err := chromedp.Run(taskCtx,
		chromedp.Navigate(url),
		chromedp.WaitVisible(`.card-body .mb-3.row`, chromedp.ByQuery),
		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return nil, fmt.Errorf("could not perform scraping actions: %w", err)
	}

	// ... (ส่วนที่เหลือของฟังก์ชันยังคงเหมือนเดิมทุกประการ) ...
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, fmt.Errorf("could not parse rendered HTML: %w", err)
	}

	data := make(map[string]string)
	doc.Find("#app .card-body .mb-3.row").Each(func(i int, sel *goquery.Selection) {
		key := strings.TrimSpace(sel.Find("label.col-form-label").Text())
		value, exists := sel.Find("input.form-control").Attr("value")
		value = strings.TrimSpace(value)

		if key != "" && exists {
			data[key] = value
		}
	})

	if len(data) == 0 {
		return nil, fmt.Errorf("scraper found no data with the current selector, the target website's HTML structure might have changed")
	}

	return data, nil
}

// MapToInspectionFields maps raw scraped inspection data to structured InspectionFields
func (s *ScraperService) MapToInspectionFields(rawData map[string]string) (*InspectionFields, error) {
	fields := &InspectionFields{}

	// Extract chassis number (REQUIRED)
	fields.ChassisNumber = s.ExtractChassisFromInspection(rawData)
	if fields.ChassisNumber == "" {
		return nil, fmt.Errorf("chassis number not found in inspection document")
	}

	// Extract basic identification fields
	fields.Mileage = s.ExtractMileageFromInspection(rawData)
	fields.Colors = s.ExtractColorsFromInspection(rawData)
	fields.LicensePlate = s.ExtractLicensePlateFromInspection(rawData)

	fields.Station = s.ExtractStationFromInspection(rawData)
	// Extract overall result
	fields.OverallPass = s.ExtractInspectionResult(rawData, []string{"ผลการตรวจ"})
	fields.BrakeResult = s.ExtractInspectionResult(rawData, []string{"ผลเบรค"})
	fields.HandbrakeResult = s.ExtractInspectionResult(rawData, []string{"ผลเบรคมือ"})
	fields.AlignmentResult = s.ExtractInspectionResult(rawData, []string{"ผลศูนย์ล้อ"})
	fields.NoiseResult = s.ExtractInspectionResult(rawData, []string{"ผลระดับเสียง"})
	fields.EmissionResult = s.ExtractInspectionResult(rawData, []string{"ผลมลพิษจากไอเสีย"})
	fields.HornResult = s.ExtractInspectionResult(rawData, []string{"ผลแตรสัญญาณ"})
	fields.SpeedometerResult = s.ExtractInspectionResult(rawData, []string{"ผลเครื่องวัดความเร็ว"})
	fields.HighLowBeamResult = s.ExtractInspectionResult(rawData, []string{"ผลโคมไฟพุ่งไกล โคมไฟพุ่งต่ำ"})
	fields.SignalLightsResult = s.ExtractInspectionResult(rawData, []string{"ผลโคมไฟเลี้ยว โคมไฟป้าย โคมไฟหยุด"})
	fields.OtherLightsResult = s.ExtractInspectionResult(rawData, []string{"โคมไฟส่องป้ายทะเบียน โคมไฟอื่นๆ"})
	fields.WindshieldResult = s.ExtractInspectionResult(rawData, []string{"กระจกกันลมหน้า-หลังและส่วนที่เป็นกระจก"})
	fields.SteeringResult = s.ExtractInspectionResult(rawData, []string{"ระบบบังคับเลี้ยวและพวงมาลัย"})
	fields.WheelsTiresResult = s.ExtractInspectionResult(rawData, []string{"ล้อและยาง"})
	fields.FuelTankResult = s.ExtractInspectionResult(rawData, []string{"ถังเชื้อเพลิง และท่อส่ง"})
	fields.ChassisResult = s.ExtractInspectionResult(rawData, []string{"เครื่องล่าง"})
	fields.BodyResult = s.ExtractInspectionResult(rawData, []string{"สภาพตัวถังและโครงรถ"})
	fields.DoorsFloorResult = s.ExtractInspectionResult(rawData, []string{"ประตูและพื้นรถ"})
	fields.SeatbeltResult = s.ExtractInspectionResult(rawData, []string{"เข็มขัดนิรภัย"})
	fields.WiperResult = s.ExtractInspectionResult(rawData, []string{"เครื่องปัดน้ำฝน"})

	return fields, nil

}

// ExtractChassisFromInspection extracts chassis/VIN from scraped key-value map
func (s *ScraperService) ExtractChassisFromInspection(kv map[string]string) string {
	// Exact field name from DLT inspection
	keys := []string{"เลขตัวถังรถ"}
	for _, k := range keys {
		if v, ok := kv[k]; ok && v != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

// ExtractColorsFromInspection extracts up to 3 color labels and translates them to English
func (s *ScraperService) ExtractColorsFromInspection(kv map[string]string) []string {
	// Exact field name from DLT inspection
	keys := []string{"สีรถ"}
	for _, k := range keys {
		if v, ok := kv[k]; ok {
			v = strings.TrimSpace(v)
			if v == "" {
				continue
			}
			// Split by comma/space if multiple colors are provided
			parts := strings.FieldsFunc(v, func(r rune) bool { return r == ',' || r == '/' || r == '|' })
			out := []string{}
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p == "" {
					continue
				}
				// Translate Thai color to database color code (e.g., "ขาว" → "WHITE")
				colorCode := utils.TranslateColorToCode(p)
				if colorCode != "" {
					out = append(out, colorCode)
				}
				if len(out) == 3 {
					break
				}
			}
			if len(out) > 0 {
				return out
			}
		}
	}
	return []string{}
}

// ExtractMileageFromInspection extracts mileage from scraped key-value map
func (s *ScraperService) ExtractMileageFromInspection(kv map[string]string) *int {
	// Exact field name from DLT inspection
	keys := []string{"ระยะทางวิ่ง"}
	for _, k := range keys {
		if v, ok := kv[k]; ok && v != "" {
			v = strings.TrimSpace(v)
			// Remove commas and non-numeric characters
			v = strings.ReplaceAll(v, ",", "")
			v = strings.ReplaceAll(v, " ", "")
			var mileage int
			if _, err := fmt.Sscanf(v, "%d", &mileage); err == nil && mileage > 0 {
				return &mileage
			}
		}
	}
	return nil
}

// ExtractStationFromInspection extracts inspection station name from scraped key-value map
func (s *ScraperService) ExtractStationFromInspection(kv map[string]string) *string {
	keys := []string{"ชื่อสถานตรวจสภาพรถ"}
	for _, k := range keys {
		if v, ok := kv[k]; ok && v != "" {
			v = strings.TrimSpace(v)
			return &v
		}
	}
	return nil
}

// ExtractLicensePlateFromInspection extracts and parses license plate from scraped key-value map
func (s *ScraperService) ExtractLicensePlateFromInspection(kv map[string]string) *LicensePlateBreakdown {
	keys := []string{"เลขทะเบียน"}
	for _, k := range keys {
		if v, ok := kv[k]; ok && v != "" {
			v = strings.TrimSpace(v)
			// Parse license plate format: "กข 5177 กรุงเทพมหานคร"
			parts := strings.Fields(v)
			breakdown := &LicensePlateBreakdown{
				Prefix:     parts[0],
				Number:     parts[1],
				ProvinceTh: parts[2]}
			return breakdown
		}
	}
	return nil
}

// ExtractOverallPassFromInspection extracts overall inspection pass/fail result
func (s *ScraperService) ExtractOverallPassFromInspection(kv map[string]string) *bool {
	keys := []string{"ผลการตรวจ"}
	return s.ExtractInspectionResult(kv, keys)
}

// ExtractInspectionResult is a generic extractor for boolean pass/fail inspection results
func (s *ScraperService) ExtractInspectionResult(kv map[string]string, possibleKeys []string) *bool {
	for _, k := range possibleKeys {
		if v, ok := kv[k]; ok && v != "" {

			v = strings.TrimSpace(v)
			v = strings.ToLower(v)

			boolResult := utils.TranslateInspectionResult(v)
			if boolResult {
				return &boolResult
			}
			return nil
		}
	}
	return nil
}

// AttachInspection attaches inspection data to a car and validates chassis match
// Returns: savedCar (on success), existingCarID (on duplicate), errorCode, error
func (s *CarService) UploadInspectionToDraft(carID int, sellerID int, inspectionFields *InspectionFields, scraperService *ScraperService) (*models.Car, *int, string, error) {
	// Get the car to check ownership and chassis
	currentCar, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return nil, nil, "", fmt.Errorf("failed to get car: %w", err)
	}

	// Check ownership
	if currentCar.SellerID != sellerID {
		return nil, nil, "", fmt.Errorf("unauthorized: you can only attach inspection to your own cars")
	}

	// Check if already published
	if currentCar.Status != "draft" {
		return nil, nil, "", fmt.Errorf("can only upload inspection to draft cars")
	}

	// Normalize both chassis numbers for comparison
	normalizedChassis := utils.NormalizeChassis(inspectionFields.ChassisNumber)

	// Look for existing cars with this chassis
	existingCars, err := s.carRepo.FindCarsByChassisNumber(normalizedChassis)
	if err != nil {
		return nil, nil, "", fmt.Errorf("failed to check for duplicates: %w", err)
	}

	// Filter out the current car
	var otherCars []models.Car
	for _, car := range existingCars {
		if car.ID != carID {
			otherCars = append(otherCars, car)
		}
	}

	// Check for conflicts
	if len(otherCars) > 0 {
		for _, car := range otherCars {
			// Check status and ownership for specific error codes
			if car.SellerID == sellerID {
				// Same seller owns another car with this chassis
				switch car.Status {
				case "draft":
					return nil, &car.ID, ErrCodeCarDuplicateOwnDraft, fmt.Errorf("you already have a draft for this vehicle. Do you want to continue with the existing draft or create a new listing?")
				case "active":
					return nil, nil, ErrCodeCarDuplicateOwnActive, fmt.Errorf("you already have an active listing for this vehicle")
				case "sold":
					return nil, nil, ErrCodeCarDuplicateOwnSold, fmt.Errorf("you have already sold this vehicle")
				case "deleted":
					return nil, nil, ErrCodeCarDuplicateOwnDeleted, fmt.Errorf("this vehicle was previously deleted from your listings")
				}
			} else {
				// Different seller owns this chassis
				if car.Status != "deleted" {
					return nil, nil, ErrCodeCarDuplicateOtherOwned, fmt.Errorf("this vehicle is already listed by another seller")
				}
			}
		}
	}

	// // Create comprehensive inspection result with all extracted fields
	inspection := &models.InspectionResult{
		CarID: carID,
		// Basic information
		Station:     inspectionFields.Station,
		OverallPass: inspectionFields.OverallPass,
		// Detailed inspection results
		BrakeResult:        inspectionFields.BrakeResult,
		HandbrakeResult:    inspectionFields.HandbrakeResult,
		AlignmentResult:    inspectionFields.AlignmentResult,
		NoiseResult:        inspectionFields.NoiseResult,
		EmissionResult:     inspectionFields.EmissionResult,
		HornResult:         inspectionFields.HornResult,
		SpeedometerResult:  inspectionFields.SpeedometerResult,
		HighLowBeamResult:  inspectionFields.HighLowBeamResult,
		SignalLightsResult: inspectionFields.SignalLightsResult,
		OtherLightsResult:  inspectionFields.OtherLightsResult,
		WindshieldResult:   inspectionFields.WindshieldResult,
		SteeringResult:     inspectionFields.SteeringResult,
		WheelsTiresResult:  inspectionFields.WheelsTiresResult,
		FuelTankResult:     inspectionFields.FuelTankResult,
		ChassisResult:      inspectionFields.ChassisResult,
		BodyResult:         inspectionFields.BodyResult,
		DoorsFloorResult:   inspectionFields.DoorsFloorResult,
		SeatbeltResult:     inspectionFields.SeatbeltResult,
		WiperResult:        inspectionFields.WiperResult,
	}

	err = s.inspectionRepo.CreateInspectionResult(inspection)
	if err != nil {
		return nil, nil, "", fmt.Errorf("failed to create inspection: %w", err)
	}

	currentCar.Mileage = inspectionFields.Mileage
	currentCar.ChassisNumber = &normalizedChassis
	// Update license plate if available (prefix, number, province)
	if inspectionFields.LicensePlate != nil {
		currentCar.Prefix = &inspectionFields.LicensePlate.Prefix
		currentCar.Number = &inspectionFields.LicensePlate.Number
		provinceID := utils.TranslateProvinceToID(inspectionFields.LicensePlate.ProvinceTh)
		if provinceID > 0 {
			currentCar.ProvinceID = &provinceID
		}
	}

	// Update colors if available (up to 3 ordered colors)
	if err := s.colorRepo.SetCarColors(carID, inspectionFields.Colors); err != nil {
		return nil, nil, "", fmt.Errorf("failed to set colors: %w", err)
	}

	// Persist authoritative fields to database
	if err := s.carRepo.UpdateCar(currentCar); err != nil {
		return nil, nil, "", fmt.Errorf("failed to save inspection fields: %w", err)
	}

	// Return the result with match status
	return currentCar, nil, "", nil
}

// ToMap converts InspectionFields to a display-ready map without any DB lookups
func (inspFields *InspectionFields) ToMap() map[string]interface{} {
	result := make(map[string]interface{})

	if inspFields.ChassisNumber != "" {
		result["chassisNumber"] = utils.NormalizeChassis(inspFields.ChassisNumber)
	}
	if inspFields.Mileage != nil && *inspFields.Mileage >= 0 {
		result["mileage"] = inspFields.Mileage
	}
	if len(inspFields.Colors) > 0 {
		colors := inspFields.Colors
		if len(colors) > 3 {
			colors = colors[:3]
		}
		result["colors"] = colors
	}
	if inspFields.LicensePlate != nil {
		result["prefix"] = inspFields.LicensePlate.Prefix
		result["number"] = inspFields.LicensePlate.Number
		result["provinceTh"] = inspFields.LicensePlate.ProvinceTh
		result["licensePlate"] = utils.ConstructLicensePlate(inspFields.LicensePlate.Prefix, inspFields.LicensePlate.Number, inspFields.LicensePlate.ProvinceTh)
	}
	result["station"] = inspFields.Station
	result["overallPass"] = *inspFields.OverallPass
	result["brakeResult"] = *inspFields.BrakeResult
	result["handbrakeResult"] = *inspFields.HandbrakeResult
	result["alignmentResult"] = *inspFields.AlignmentResult
	result["noiseResult"] = *inspFields.NoiseResult
	result["emissionResult"] = *inspFields.EmissionResult
	result["hornResult"] = *inspFields.HornResult
	result["speedometerResult"] = *inspFields.SpeedometerResult
	result["highLowBeamResult"] = *inspFields.HighLowBeamResult
	result["signalLightsResult"] = *inspFields.SignalLightsResult
	result["otherLightsResult"] = *inspFields.OtherLightsResult
	result["windshieldResult"] = *inspFields.WindshieldResult
	result["steeringResult"] = *inspFields.SteeringResult
	result["wheelsTiresResult"] = *inspFields.WheelsTiresResult
	result["fuelTankResult"] = *inspFields.FuelTankResult
	result["chassisResult"] = *inspFields.ChassisResult
	result["bodyResult"] = *inspFields.BodyResult
	result["doorsFloorResult"] = *inspFields.DoorsFloorResult
	result["seatbeltResult"] = *inspFields.SeatbeltResult
	result["wiperResult"] = *inspFields.WiperResult
	return result
}
