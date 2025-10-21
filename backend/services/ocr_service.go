package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

// URL v2 ที่ถูกต้อง
const aigenAPIURL = "https://api.aigen.online/aiscript/vehicle-registration-book/v2"

// Struct สำหรับสร้าง JSON request body (ถูกต้องแล้ว)
type aigenJSONRequest struct {
	Image string `json:"image"`
}

// ===================================================================
// === จุดที่แก้ไข (Final Struct) ===
// ===================================================================
// Struct ย่อยสำหรับดึงค่า "value" ที่ซ้อนอยู่ข้างใน
type valueObject struct {
	Value string `json:"value"`
}

// Struct หลักสำหรับรับ Response ทั้งหมด
// เราจะใช้ map[string]valueObject เพื่อรองรับ key แบบ dynamic (ownership, model, etc.)
type AigenSuccessResponse struct {
	Status string                   `json:"status"`
	Data   []map[string]valueObject `json:"data"`
}

// ===================================================================

// BookFields represents structured data extracted from vehicle registration book
type BookFields struct {
	ChassisNumber      string  `json:"chassisNumber"`
	BrandName          *string `json:"brandName"`
	ModelName          *string `json:"modelName"`
	Year               *int    `json:"year"`
	EngineCC           *int    `json:"engineCc"`
	Seats              *int    `json:"seats"`
	RegistrationNumber string  `json:"registrationNumber"` // License plate
	Province           *string `json:"province"`
	OwnerName          *string `json:"ownerName"`
}

// ToMap converts BookFields to a map for JSON response
func (bf *BookFields) ToMap() map[string]interface{} {
	m := make(map[string]interface{})
	m["chassisNumber"] = bf.ChassisNumber
	if bf.BrandName != nil {
		m["brandName"] = *bf.BrandName
	}
	if bf.ModelName != nil {
		m["modelName"] = *bf.ModelName
	}
	if bf.Year != nil {
		m["year"] = *bf.Year
	}
	if bf.EngineCC != nil {
		m["engineCc"] = *bf.EngineCC
	}
	if bf.Seats != nil {
		m["seats"] = *bf.Seats
	}
	if bf.RegistrationNumber != "" {
		m["registrationNumber"] = bf.RegistrationNumber
	}
	if bf.Province != nil {
		m["province"] = *bf.Province
	}
	if bf.OwnerName != nil {
		m["ownerName"] = *bf.OwnerName
	}
	return m
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

// ExtractFieldsFromFile calls AIGEN OCR and returns raw key->value fields
func (s *OCRService) ExtractFieldsFromFile(file multipart.File, handler *multipart.FileHeader) (map[string]string, error) {
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
func (s *OCRService) MapToBookFields(rawFields map[string]string) (*BookFields, error) {
	bookFields := &BookFields{}

	// Chassis number (car_number in OCR API)
	if chassis, ok := rawFields["car_number"]; ok && chassis != "" {
		bookFields.ChassisNumber = strings.TrimSpace(chassis)
	}

	// Brand name (brand_car in OCR API)
	if brand, ok := rawFields["brand_car"]; ok && brand != "" {
		trimmed := strings.TrimSpace(brand)
		bookFields.BrandName = &trimmed
	}

	// Model name (model in OCR API)
	if model, ok := rawFields["model"]; ok && model != "" {
		trimmed := strings.TrimSpace(model)
		bookFields.ModelName = &trimmed
	}

	// Engine CC (engine_size in OCR API)
	if engineCc, ok := rawFields["engine_size"]; ok && engineCc != "" {
		var cc int
		if _, err := fmt.Sscanf(engineCc, "%d", &cc); err == nil {
			bookFields.EngineCC = &cc
		}
	}

	// Seats (number_of_seat in OCR API)
	if seats, ok := rawFields["number_of_seat"]; ok && seats != "" {
		var s int
		if _, err := fmt.Sscanf(seats, "%d", &s); err == nil {
			bookFields.Seats = &s
		}
	}

	// Registration number (registration_number_car in OCR API)
	if regNum, ok := rawFields["registration_number_car"]; ok && regNum != "" {
		bookFields.RegistrationNumber = strings.TrimSpace(regNum)
	}

	// Province (province in OCR API)
	if province, ok := rawFields["province"]; ok && province != "" {
		trimmed := strings.TrimSpace(province)
		bookFields.Province = &trimmed
	}

	// Owner name (ownership in OCR API - full name with title)
	if owner, ok := rawFields["ownership"]; ok && owner != "" {
		trimmed := strings.TrimSpace(owner)
		bookFields.OwnerName = &trimmed
	}

	if bookFields.ChassisNumber == "" {
		return nil, fmt.Errorf("chassis number not found in document")
	}
	if bookFields.RegistrationNumber == "" {
		return nil, fmt.Errorf("registration number not found in document")
	}

	return bookFields, nil
}
