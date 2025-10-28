package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils" // Import utils สำหรับ response
)

// AdminExtractionHandler handles PDF extraction related endpoints for admins.
type AdminExtractionHandler struct {
	ExtractionService *services.ExtractionService
	// อาจจะเพิ่ม dependency อื่นๆ ถ้าจำเป็น เช่น logger
}

// NewAdminExtractionHandler creates a new AdminExtractionHandler.
func NewAdminExtractionHandler(es *services.ExtractionService) *AdminExtractionHandler {
	return &AdminExtractionHandler{
		ExtractionService: es,
	}
}

// HandleImportMarketPrices handles the PDF upload, extracts data, and returns JSON.
func (h *AdminExtractionHandler) HandleImportMarketPrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	// --- File Upload Handling ---
	// Limit file size (e.g., 50MB)
	err := r.ParseMultipartForm(50 << 20) // 50 MB max memory
	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "Error processing uploaded file: "+err.Error())
		return
	}

	file, fileHeader, err := r.FormFile("marketPricePdf") // Field name from the form
	if err != nil {
		log.Printf("Error retrieving file from form: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "PDF file ('marketPricePdf' field) is required.")
		return
	}
	defer file.Close()

	// Validate file type (basic check)
	if fileHeader.Header.Get("Content-Type") != "application/pdf" && filepath.Ext(fileHeader.Filename) != ".pdf" {
		log.Printf("Invalid file type uploaded: %s", fileHeader.Header.Get("Content-Type"))
		utils.WriteError(w, http.StatusBadRequest, "Invalid file type. Only PDF is allowed.")
		return
	}

	// Create a temporary file to save the uploaded PDF
	tempDir := os.TempDir() // Use system temp dir or a configured one
	tempFileName := fmt.Sprintf("market_price_upload_%d%s", time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
	tempFilePath := filepath.Join(tempDir, tempFileName)

	log.Printf("Saving uploaded PDF to temporary file: %s", tempFilePath)

	tempFile, err := os.Create(tempFilePath)
	if err != nil {
		log.Printf("Error creating temporary file: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save uploaded file.")
		return
	}
	// No need to defer tempFile.Close() here, as we close it after copy

	// Copy uploaded file content to the temporary file
	_, err = io.Copy(tempFile, file)
	// Close the temp file *after* copying
	closeErr := tempFile.Close()

	// *** ทำการ Cleanup ไฟล์ temp หลังจากจบ Request นี้ ***
	defer func() {
		log.Printf("Attempting to delete temporary file: %s", tempFilePath)
		deleteErr := os.Remove(tempFilePath)
		if deleteErr != nil {
			log.Printf("Warning: Failed to delete temporary file %s: %v", tempFilePath, deleteErr)
		}
	}()

	if err != nil { // Prioritize copy error
		log.Printf("Error copying uploaded file content: %v", err)
		// No need for os.Remove here as defer will handle it
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save uploaded file content.")
		return
	}
	if closeErr != nil { // Log close error if it happens
		log.Printf("Warning: Error closing temporary file after copy: %v", closeErr)
	}
	// --- End File Upload Handling ---

	// --- *** เปลี่ยน: เรียก Extraction Service แบบ Synchronous *** ---
	log.Printf("Starting synchronous extraction for file: %s", tempFilePath)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute) // ตั้ง Timeout 2 นาทีเผื่อ Extract นาน
	defer cancel()

	extractedData, extractErr := h.ExtractionService.ExtractMarketPricesFromPDF(ctx, tempFilePath)

	if extractErr != nil {
		log.Printf("ERROR during synchronous market price extraction from %s: %v", tempFilePath, extractErr)
		// ส่ง Error กลับไปหา Client พร้อมรายละเอียด
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Extraction failed: %v", extractErr))
		return
	}

	log.Printf("Synchronous extraction from %s completed. Found %d records.", tempFilePath, len(extractedData))

	// --- *** เปลี่ยน: ลบ go func(...) เดิมออก *** ---
	// (ไม่มีโค้ด go func เดิมแล้ว)

	// --- *** เปลี่ยน: ตอบกลับ Client ด้วย Status 200 OK และข้อมูล JSON ที่ Extract ได้ *** ---
	utils.WriteJSON(w, http.StatusOK, extractedData) // ส่ง Slice กลับไปเลย
	log.Println("Admin ImportMarketPrices request processed, extraction complete, JSON response sent.")
}