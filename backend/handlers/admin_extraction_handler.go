package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

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

// HandleImportMarketPrices handles the PDF upload, extracts data, and returns JSON.
func (h *AdminExtractionHandler) HandleImportMarketPrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

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

	// --- Call Extraction Service Synchronously ---
	log.Printf("Starting synchronous extraction for file: %s", tempFilePath)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	extractedData, extractErr := h.ExtractionService.ExtractMarketPricesFromPDF(ctx, tempFilePath)
	if extractErr != nil {
		log.Printf("ERROR during synchronous market price extraction from %s: %v", tempFilePath, extractErr)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Extraction failed: %v", extractErr))
		return
	}
	
	log.Printf("Synchronous extraction from %s completed. Found %d records.", tempFilePath, len(extractedData.FinalPrices))

	// --- Respond to Client with Status 200 OK and Extracted JSON Data ---
	utils.WriteJSON(w, http.StatusOK, extractedData) // ส่ง struct กลับไปทั้งหมด (ถูกต้องแล้วสำหรับ POC)
	log.Println("Admin ImportMarketPrices request processed, extraction complete, JSON response sent.")
}
// HandleCommitMarketPrices receives extracted market price data as JSON and commits it to the database.
func (h *AdminExtractionHandler) HandleCommitMarketPrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	// 1. Decode JSON Body
	var pricesToCommit []services.MarketPrice // Use the struct from the services package
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields() // Optional: reject requests with extra fields

	err := decoder.Decode(&pricesToCommit)
	if err != nil {
		log.Printf("Error decoding JSON body for commit: %v", err)
		if err == io.EOF {
			utils.WriteError(w, http.StatusBadRequest, "Request body cannot be empty.")
		} else if _, ok := err.(*json.SyntaxError); ok {
			utils.WriteError(w, http.StatusBadRequest, "Invalid JSON format in request body.")
		} else {
			utils.WriteError(w, http.StatusBadRequest, fmt.Sprintf("Error decoding request body: %v", err))
		}
		return
	}

	if len(pricesToCommit) == 0 {
		log.Println("Received commit request with empty data array.")
		utils.WriteError(w, http.StatusBadRequest, "Received empty data array. Nothing to commit.")
		return
	}

	log.Printf("Received commit request with %d records.", len(pricesToCommit))

	// 2. Call Service to Commit Data
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute) // Longer timeout for DB operations
	defer cancel()

	inserted, updated, commitErr := h.ExtractionService.CommitMarketPrices(ctx, pricesToCommit)

	if commitErr != nil {
		log.Printf("ERROR during market price commit: %v", commitErr)
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Database commit failed: %v", commitErr))
		return
	}

	// 3. Respond Success
	log.Printf("Market price commit successful. Inserted: %d, Updated: %d", inserted, updated)
	response := map[string]interface{}{
		"message":        "Market prices committed successfully.",
		"inserted_count": inserted,
		"updated_count":  updated,
	}
	utils.WriteJSON(w, http.StatusOK, response)
}