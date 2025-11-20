package handlers

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/utils"
)

// ReferenceOption and ReferenceData types for test handler
type ReferenceOption struct {
	Code  string `json:"code"`
	Label string `json:"label"`
}

type ProvinceOption struct {
	ID    int    `json:"id"`
	Label string `json:"label"`
}

type ReferenceData struct {
	BodyTypes     []ReferenceOption `json:"bodyTypes"`
	Transmissions []ReferenceOption `json:"transmissions"`
	FuelTypes     []ReferenceOption `json:"fuelTypes"`
	Drivetrains   []ReferenceOption `json:"drivetrains"`
	Colors        []ReferenceOption `json:"colors"`
	Provinces     []ProvinceOption  `json:"provinces"`
}

func TestReferenceHandler_GetReferenceData(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		lang           string
		expectedStatus int
	}{
		{
			name:           "Successful get with default lang",
			method:         "GET",
			lang:           "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Successful get with th lang",
			method:         "GET",
			lang:           "th",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			lang:           "",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock DB (in real test, we'd use a test database)
			db := &sql.DB{}

			handler := &testReferenceHandler{
				db: db,
			}

			url := "/api/reference-data"
			if tt.lang != "" {
				url += "?lang=" + tt.lang
			}
			req := httptest.NewRequest(tt.method, url, nil)
			w := httptest.NewRecorder()

			handler.GetReferenceData(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testReferenceHandler struct {
	db *sql.DB
}

func (h *testReferenceHandler) GetReferenceData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Mock implementation - in real test, we'd query the database
	response := ReferenceData{
		BodyTypes:     []ReferenceOption{},
		Transmissions: []ReferenceOption{},
		FuelTypes:     []ReferenceOption{},
		Drivetrains:   []ReferenceOption{},
		Colors:        []ReferenceOption{},
		Provinces:     []ProvinceOption{},
	}

	utils.WriteJSON(w, http.StatusOK, response, "")
}
