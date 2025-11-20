package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockExtractionService is defined in mocks.go

func TestAdminExtractionHandler_HandleImportMarketPrices(t *testing.T) {
	tests := []struct {
		name                    string
		method                  string
		hasFile                 bool
		extractMarketPricesFunc func(ctx context.Context, filePath string) ([]services.MarketPrice, error)
		expectedStatus          int
	}{
		{
			name:    "Successful import",
			method:  "POST",
			hasFile: true,
			extractMarketPricesFunc: func(ctx context.Context, filePath string) ([]services.MarketPrice, error) {
				return []services.MarketPrice{}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "No file",
			method:         "POST",
			hasFile:        false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			hasFile:        true,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockExtractionService := &mockExtractionService{
				extractMarketPricesFunc: tt.extractMarketPricesFunc,
			}

			handler := &testAdminExtractionHandler{
				extractionService: mockExtractionService,
			}

			var req *http.Request
			if tt.hasFile {
				body := &bytes.Buffer{}
				writer := multipart.NewWriter(body)
				part, _ := writer.CreateFormFile("marketPricePdf", "test.pdf")
				part.Write([]byte("test content"))
				writer.Close()

				req = httptest.NewRequest(tt.method, "/admin/upload-price", body)
				req.Header.Set("Content-Type", writer.FormDataContentType())
			} else {
				req = httptest.NewRequest(tt.method, "/admin/upload-price", nil)
			}
			w := httptest.NewRecorder()

			handler.HandleImportMarketPrices(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testAdminExtractionHandler struct {
	extractionService *mockExtractionService
}

func (h *testAdminExtractionHandler) HandleImportMarketPrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Error processing uploaded file")
		return
	}

	file, _, err := r.FormFile("marketPricePdf")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "PDF file ('marketPricePdf' field) is required.")
		return
	}
	defer file.Close()

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()

	extractedData, err := h.extractionService.ExtractMarketPricesFromPDF(ctx, "temp_file_path")
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Extraction failed")
		return
	}

	utils.WriteJSON(w, http.StatusOK, extractedData, "")
}

func TestAdminExtractionHandler_HandleCommitMarketPrices(t *testing.T) {
	tests := []struct {
		name                   string
		method                 string
		requestBody            interface{}
		commitMarketPricesFunc func(ctx context.Context, prices []services.MarketPrice) (int, int, error)
		expectedStatus         int
	}{
		{
			name:   "Successful commit",
			method: "POST",
			requestBody: []services.MarketPrice{
				{},
			},
			commitMarketPricesFunc: func(ctx context.Context, prices []services.MarketPrice) (int, int, error) {
				return 1, 0, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Empty data",
			method:         "POST",
			requestBody:    []services.MarketPrice{},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			requestBody:    nil,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockExtractionService := &mockExtractionService{
				commitMarketPricesFunc: tt.commitMarketPricesFunc,
			}

			handler := &testAdminExtractionHandler{
				extractionService: mockExtractionService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				reqBody, _ = json.Marshal(tt.requestBody)
			}
			req := httptest.NewRequest(tt.method, "/admin/commit-prices", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			handler.HandleCommitMarketPrices(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testAdminExtractionHandler) HandleCommitMarketPrices(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method Not Allowed")
		return
	}

	var pricesToCommit []services.MarketPrice
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	err := decoder.Decode(&pricesToCommit)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if len(pricesToCommit) == 0 {
		utils.WriteError(w, http.StatusBadRequest, "Received empty data array")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	inserted, updated, err := h.extractionService.CommitMarketPrices(ctx, pricesToCommit)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Database commit failed")
		return
	}

	response := models.MarketPriceImportResponse{
		Message:       "Market prices committed successfully.",
		InsertedCount: inserted,
		UpdatedCount:  updated,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}
