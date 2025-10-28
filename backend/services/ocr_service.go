package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// URL v2 ที่ถูกต้อง
const aigenAPIURL = "https://api.aigen.online/aiscript/vehicle-registration-book/v2"

type aigenJSONRequest struct {
	Image string `json:"image"`
}
type valueObject struct {
	Value string `json:"value"`
}

type AigenSuccessResponse struct {
	Status string                   `json:"status"`
	Data   []map[string]valueObject `json:"data"`
}

// BookFields represents structured data extracted from vehicle registration book
type BookFields struct {
	ChassisNumber string  `json:"chassisNumber"` // Required
	BrandName     *string `json:"brandName"`     // Optional
	Year          *int    `json:"year"`          // Optional
	EngineCC      *int    `json:"engineCc"`      // Optional (rounded to int)
	Seats         *int    `json:"seats"`         // Optional
	// RegistrationNumber string  `json:"registrationNumber"` // Required - License plate
	// Province           *string `json:"province"`           // Optional
}

type OCRService struct {
	apiKey string
	client *http.Client
}

func NewOCRService(apiKey string) *OCRService {
	return &OCRService{
		apiKey: apiKey,
		client: &http.Client{Timeout: 20 * time.Second},
	}
}

// OCRFromFile calls AIGEN OCR and returns raw key->value fields
func (s *OCRService) OCRFromFile(file multipart.File, handler *multipart.FileHeader) (map[string]string, error) {
	// Reset file reader to beginning if seekable
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, io.SeekStart)
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("could not read file bytes: %w", err)
	}

	base64Image := base64.StdEncoding.EncodeToString(fileBytes)
	requestPayload := aigenJSONRequest{Image: base64Image}
	jsonBody, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("could not marshal json request: %w", err)
	}

	req, err := http.NewRequest("POST", aigenAPIURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("could not create request to AIGEN: %w", err)
	}
	req.Header.Set("x-aigen-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call AIGEN service: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read AIGEN response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp map[string]interface{}
		if err := json.Unmarshal(respBody, &errorResp); err == nil {
			if errors, ok := errorResp["error"].([]interface{}); ok && len(errors) > 0 {
				if errorObj, ok := errors[0].(map[string]interface{}); ok {
					if message, ok := errorObj["message"].(string); ok {
						return nil, fmt.Errorf("AIGEN API error: %s", message)
					}
				}
			}
		}
		return nil, fmt.Errorf("AIGEN service returned an error. Status: %d, Body: %s", resp.StatusCode, string(respBody))
	}

	var aigenResp AigenSuccessResponse
	if err := json.Unmarshal(respBody, &aigenResp); err != nil {
		return nil, fmt.Errorf("could not parse AIGEN response: %w", err)
	}

	if len(aigenResp.Data) == 0 {
		return map[string]string{}, nil
	}

	rawFields := make(map[string]string)
	for fieldName, fieldValue := range aigenResp.Data[0] {
		rawFields[fieldName] = fieldValue.Value
	}

	return rawFields, nil
}

// MapToBookFields maps raw OCR fields to structured BookFields
// Uses exact field names from AIGEN OCR API response
func (s *OCRService) MapToBookFields(rawFields map[string]string) (*BookFields, error) {
	bookFields := &BookFields{}

	// Chassis number (exact field: car_number)
	if chassis, ok := rawFields["car_number"]; ok && chassis != "" {
		normalized := utils.NormalizeChassis(chassis)
		if len(normalized) < 10 || len(normalized) > 30 {
			return nil, fmt.Errorf("invalid chassis number length: must be between 10 and 30 characters")
		}
		bookFields.ChassisNumber = normalized
	}

	// Brand name (exact field: brand_car)
	if brand, ok := rawFields["brand_car"]; ok && brand != "" {
		trimmed := strings.TrimSpace(brand)
		bookFields.BrandName = &trimmed
	}

	// Year (exact field: year_model)
	if year, ok := rawFields["year_model"]; ok && year != "" {
		var y int
		if _, err := fmt.Sscanf(year, "%d", &y); err == nil {
			bookFields.Year = &y
		}
	}

	// Engine CC (exact field: engine_size)
	if engineCc, ok := rawFields["engine_size"]; ok && engineCc != "" {
		var cc float64
		// Parse as float to handle various formats
		if _, err := fmt.Sscanf(engineCc, "%f", &cc); err == nil {
			rounded := int(math.Round(cc))
			bookFields.EngineCC = &rounded
		}
	}

	// Seats (exact field: number_of_seat)
	if seats, ok := rawFields["number_of_seat"]; ok && seats != "" {
		var s int
		if _, err := fmt.Sscanf(seats, "%d", &s); err == nil {
			bookFields.Seats = &s
		}
	}

	// Registration number (exact field: registration_number_car)
	// if regNum, ok := rawFields["registration_number_car"]; ok && regNum != "" {
	// 	bookFields.RegistrationNumber = strings.TrimSpace(regNum)
	// }

	// if province, ok := rawFields["province"]; ok && province != "" {
	// 	bookFields.Province = &province
	// }

	// Validate required fields
	if bookFields.ChassisNumber == "" {
		return nil, fmt.Errorf("chassis number not found in document")
	}
	// if bookFields.RegistrationNumber == "" {
	// 	return nil, fmt.Errorf("registration number not found in document")
	// }

	return bookFields, nil
}

// UploadBookToDraft uploads a book to an existing draft car with duplicate resolution
// Returns: (car, action, redirectToCarID, errorCode, error)
func (s *CarService) UploadBookToDraft(carID int, sellerID int, bookFields *BookFields) (*models.Car, string, *int, string, error) {
	// Get the current draft car
	currentCar, err := s.carRepo.GetCarByID(carID)
	if err != nil {
		return nil, "", nil, "", fmt.Errorf("failed to get car: %w", err)
	}

	// Check ownership
	if currentCar.SellerID != sellerID {
		return nil, "", nil, "", fmt.Errorf("unauthorized: you can only upload books to your own cars")
	}

	// Check if already published
	if currentCar.Status != "draft" {
		return nil, "", nil, "", fmt.Errorf("can only upload book to draft cars")
	}

	currentCar.BrandName = bookFields.BrandName
	currentCar.Year = bookFields.Year
	currentCar.EngineCC = bookFields.EngineCC // Already rounded in OCR service
	currentCar.Seats = bookFields.Seats

	// Persist helper fields to database
	if err := s.carRepo.UpdateCar(currentCar); err != nil {
		return nil, "", nil, "", fmt.Errorf("failed to save OCR fields: %w", err)
	}

	return currentCar, "stay", nil, "", nil
}

// ToMap converts BookFields to a map for API responses
func (bookFields *BookFields) ToMap() map[string]interface{} {
	result := make(map[string]interface{})

	// result["chassisNumber"] = bookFields.ChassisNumber
	if bookFields.BrandName != nil {
		result["brandName"] = *bookFields.BrandName
	}
	if bookFields.Year != nil {
		result["year"] = *bookFields.Year
	}
	if bookFields.EngineCC != nil {
		result["engineCc"] = *bookFields.EngineCC
	}
	if bookFields.Seats != nil {
		result["seats"] = *bookFields.Seats
	}
	// result["registrationNumber"] = bookFields.RegistrationNumber
	// if bookFields.Province != nil {
	// 	result["province"] = *bookFields.Province
	// }
	// result["province"] = utils.DisplayProvince(*bookFields.Province)

	return result
}
