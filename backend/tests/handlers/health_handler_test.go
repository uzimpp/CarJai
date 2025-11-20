package handlers

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/handlers"
)

func TestHealthHandler_Health(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		db             *sql.DB
		expectedStatus int
	}{
		{
			name:           "Method not allowed",
			method:         "POST",
			db:             nil,
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "GET request (will fail DB ping but test handler logic)",
			method:         "GET",
			db:             nil,                           // nil DB will cause ping to fail, but handler should still respond
			expectedStatus: http.StatusServiceUnavailable, // DB unhealthy = ServiceUnavailable
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := handlers.NewHealthHandler(tt.db)

			req := httptest.NewRequest(tt.method, "/health", nil)
			w := httptest.NewRecorder()

			handler.Health(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}
