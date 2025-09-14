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
	Status string                       `json:"status"`
	Data   []map[string]valueObject `json:"data"`
}
// ===================================================================

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

func (s *OCRService) ExtractTextFromFile(file multipart.File, handler *multipart.FileHeader) (string, error) {
	// ส่วนของการสร้างและส่ง Request ถูกต้องสมบูรณ์แล้ว ไม่ต้องแก้ไข
	fileBytes, err := io.ReadAll(file)
	if err != nil { return "", fmt.Errorf("could not read file bytes: %w", err) }
	base64Image := base64.StdEncoding.EncodeToString(fileBytes)
	requestPayload := aigenJSONRequest{Image: base64Image}
	jsonBody, err := json.Marshal(requestPayload)
	if err != nil { return "", fmt.Errorf("could not marshal json request: %w", err) }
	req, err := http.NewRequest("POST", aigenAPIURL, bytes.NewBuffer(jsonBody))
	if err != nil { return "", fmt.Errorf("could not create request to AIGEN: %w", err) }
	req.Header.Set("x-aigen-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
	if err != nil { return "", fmt.Errorf("failed to call AIGEN service: %w", err) }
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil { return "", fmt.Errorf("failed to read AIGEN response body: %w", err) }
	if resp.StatusCode != http.StatusOK { return "", fmt.Errorf("AIGEN service returned an error. Status: %d, Body: %s", resp.StatusCode, string(respBody)) }

	// ส่วนของการ Parse และรวมผลลัพธ์ (แก้ไขใหม่ทั้งหมด)
	var aigenResp AigenSuccessResponse
	if err := json.Unmarshal(respBody, &aigenResp); err != nil {
		return "", fmt.Errorf("could not parse AIGEN response: %w", err)
	}
	
	// ===================================================================
	// === จุดที่แก้ไข (Final Logic) ===
	// ===================================================================
	// ตรวจสอบว่า data array มีข้อมูลหรือไม่
	if len(aigenResp.Data) == 0 {
		return "No data found in response.", nil
	}

	// data[0] คือ object ที่มี "ownership", "model" ฯลฯ อยู่ข้างใน
	fields := aigenResp.Data[0]
	
	var resultBuilder strings.Builder
	
	// วน loop ผ่านทุก field ที่ได้มา (ownership, model, etc.)
	for fieldName, fieldValue := range fields {
		// นำชื่อ field และค่า value มาต่อกัน
		// เช่น "ownership: ไอเจ็น จำกัด"
		resultBuilder.WriteString(fmt.Sprintf("%s: %s\n", fieldName, fieldValue.Value))
	}
	
	return resultBuilder.String(), nil
	// ===================================================================
}