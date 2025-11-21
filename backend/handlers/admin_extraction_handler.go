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

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminExtractionHandler handles PDF extraction related endpoints for admins.
type AdminExtractionHandler struct {
	ExtractionService *services.ExtractionService
}

// NewAdminExtractionHandler creates a new AdminExtractionHandler.
func NewAdminExtractionHandler(es *services.ExtractionService) *AdminExtractionHandler {
	return &AdminExtractionHandler{
		ExtractionService: es,
	}
}

// HandleImportMarketPrices handles the PDF upload, extracts data, and commits directly to database.
func (h *AdminExtractionHandler) HandleImportMarketPrices(w http.ResponseWriter, r *http.Request) {
	// --- File Upload Handling ---
	err := r.ParseMultipartForm(50 << 20) // 50 MB
	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "Error processing uploaded file: "+err.Error())
		return
	}
	file, fileHeader, err := r.FormFile("marketPricePdf")
	if err != nil {
		log.Printf("Error retrieving file from form: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "PDF file ('marketPricePdf' field) is required.")
		return
	}
	defer file.Close()
	if fileHeader.Header.Get("Content-Type") != "application/pdf" && filepath.Ext(fileHeader.Filename) != ".pdf" {
		log.Printf("Invalid file type uploaded: %s", fileHeader.Header.Get("Content-Type"))
		utils.WriteError(w, http.StatusBadRequest, "Invalid file type. Only PDF is allowed.")
		return
	}

	tempDir := os.TempDir()
	tempFileName := fmt.Sprintf("market_price_upload_%d%s", time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
	tempFilePath := filepath.Join(tempDir, tempFileName)
	log.Printf("Saving uploaded PDF to temporary file: %s", tempFilePath)
	tempFile, err := os.Create(tempFilePath)
	if err != nil {
		log.Printf("Error creating temporary file: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save uploaded file.")
		return
	}
	_, err = io.Copy(tempFile, file)
	closeErr := tempFile.Close()
	defer func() {
		log.Printf("Attempting to delete temporary file: %s", tempFilePath)
		deleteErr := os.Remove(tempFilePath)
		if deleteErr != nil {
			log.Printf("Warning: Failed to delete temporary file %s: %v", tempFilePath, deleteErr)
		}
	}()
	if err != nil {
		log.Printf("Error copying uploaded file content: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to save uploaded file content.")
		return
	}
	if closeErr != nil {
		log.Printf("Warning: Error closing temporary file after copy: %v", closeErr)
	}
	// --- End File Upload Handling ---

	// --- Call Import Service (Extract + Commit) ---
	log.Printf("Starting market price import (extraction + database commit) for file: %s", tempFilePath)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute) // Longer timeout for DB operations
	defer cancel()

	inserted, updated, importErr := h.ExtractionService.ImportMarketPricesFromPDF(ctx, tempFilePath)
	if importErr != nil {
		log.Printf("ERROR during market price import from %s: %v", tempFilePath, importErr)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Import failed: %v", importErr))
		return
	}

	log.Printf("Market price import from %s completed successfully. Inserted: %d, Updated: %d", tempFilePath, inserted, updated)

	// --- Respond with Success ---
	response := models.MarketPriceImportResponse{
		Message:       "Market prices imported successfully.",
		InsertedCount: inserted,
		UpdatedCount:  updated,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
	log.Println("Admin ImportMarketPrices request processed successfully.")
}

// --- New Handler: Receive JSON and Save to Database ---
// HandleGetMarketPrices retrieves all market prices from the database.
func (h *AdminExtractionHandler) HandleGetMarketPrices(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	prices, err := h.ExtractionService.GetAllMarketPrices(ctx)
	if err != nil {
		log.Printf("ERROR fetching market prices: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to fetch market prices: %v", err))
		return
	}

	log.Printf("Successfully retrieved %d market prices.", len(prices))
	utils.WriteJSON(w, http.StatusOK, prices, "")
}
