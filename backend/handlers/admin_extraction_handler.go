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

// HandleImportMarketPrices handles the PDF upload and triggers the import process.
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
	if err != nil { // Prioritize copy error
		log.Printf("Error copying uploaded file content: %v", err)
		os.Remove(tempFilePath) // Attempt to clean up
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save uploaded file content.")
		return
	}
	if closeErr != nil { // Log close error if it happens
		log.Printf("Warning: Error closing temporary file after copy: %v", closeErr)
	}
	// --- End File Upload Handling ---

	// --- Trigger Import Process (Background) ---
	log.Printf("Triggering background import for file: %s", tempFilePath)
	go func(filePathToDelete string) {
		ctx := context.Background() // Create a new context for the goroutine
		inserted, updated, importErr := h.ExtractionService.ImportMarketPricesFromPDF(ctx, filePathToDelete)

		// Log result (in production, use a more robust notification system)
		if importErr != nil {
			log.Printf("ERROR during background market price import from %s: %v", filePathToDelete, importErr)
		} else {
			log.Printf("Background market price import from %s completed. Inserted: %d, Updated: %d", filePathToDelete, inserted, updated)
		}

		// Clean up the temporary file
		log.Printf("Deleting temporary file: %s", filePathToDelete)
		deleteErr := os.Remove(filePathToDelete)
		if deleteErr != nil {
			log.Printf("Warning: Failed to delete temporary file %s: %v", filePathToDelete, deleteErr)
		}
	}(tempFilePath)

	// --- Respond to Client ---
	utils.WriteJSON(w, http.StatusAccepted, map[string]string{"message": "PDF received and import process started in background."})
	log.Println("Admin ImportMarketPrices request processed, background task started.")
}