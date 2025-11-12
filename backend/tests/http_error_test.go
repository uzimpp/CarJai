package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

func TestWriteError_AdminErrorResponse(t *testing.T) {
	rec := httptest.NewRecorder()

	utils.WriteError(rec, http.StatusBadRequest, "invalid input")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp models.AdminErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Success {
		t.Errorf("expected success=false, got true")
	}
	if resp.Error != "invalid input" {
		t.Errorf("expected error message 'invalid input', got %q", resp.Error)
	}
	if resp.Code != http.StatusBadRequest {
		t.Errorf("expected code %d, got %d", http.StatusBadRequest, resp.Code)
	}
}

func TestWriteJSONError_GenericErrorResponse(t *testing.T) {
	rec := httptest.NewRecorder()

	utils.WriteJSONError(rec, http.StatusUnauthorized, "unauthorized")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if success, ok := resp["success"].(bool); !ok || success {
		t.Errorf("expected success=false, got %v (ok=%v)", success, ok)
	}

	if msg, ok := resp["message"].(string); !ok || msg != "unauthorized" {
		t.Errorf("expected message 'unauthorized', got %v (ok=%v)", msg, ok)
	}
}

