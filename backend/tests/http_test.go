package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/utils"
)

// TestWriteError tests error responses (statusCode >= 400)
func TestWriteError(t *testing.T) {
	rec := httptest.NewRecorder()

	utils.WriteError(rec, http.StatusBadRequest, "invalid input")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Success {
		t.Errorf("expected success=false, got true")
	}
	if resp.Message != "invalid input" {
		t.Errorf("expected message 'invalid input', got %q", resp.Message)
	}
	if resp.Code != http.StatusBadRequest {
		t.Errorf("expected code %d, got %d", http.StatusBadRequest, resp.Code)
	}
	if resp.Data != nil {
		t.Errorf("expected data to be nil for error responses, got %v", resp.Data)
	}
}

// TestWriteJSON_SuccessWithData tests success responses with data (statusCode < 400, data != nil)
func TestWriteJSON_SuccessWithData(t *testing.T) {
	rec := httptest.NewRecorder()

	testData := map[string]string{"key": "value"}
	utils.WriteJSON(rec, http.StatusOK, testData, "Success message")

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if !resp.Success {
		t.Errorf("expected success=true, got false")
	}
	if resp.Message != "Success message" {
		t.Errorf("expected message 'Success message', got %q", resp.Message)
	}
	if resp.Code != http.StatusOK {
		t.Errorf("expected code %d, got %d", http.StatusOK, resp.Code)
	}
	if resp.Data == nil {
		t.Errorf("expected data to be present for success responses with data")
	}

	// Verify data content
	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("expected data to be map[string]interface{}, got %T", resp.Data)
	}
	if dataMap["key"] != "value" {
		t.Errorf("expected data['key']='value', got %v", dataMap["key"])
	}
}

// TestWriteJSON_SuccessNoData tests success responses without data (statusCode < 400, data == nil)
func TestWriteJSON_SuccessNoData(t *testing.T) {
	rec := httptest.NewRecorder()

	utils.WriteJSON(rec, http.StatusOK, nil, "Operation completed successfully")

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if !resp.Success {
		t.Errorf("expected success=true, got false")
	}
	if resp.Message != "Operation completed successfully" {
		t.Errorf("expected message 'Operation completed successfully', got %q", resp.Message)
	}
	if resp.Code != http.StatusOK {
		t.Errorf("expected code %d, got %d", http.StatusOK, resp.Code)
	}
	// Data should be nil or omitted (due to omitempty)
	if resp.Data != nil {
		t.Errorf("expected data to be nil for success responses without data, got %v", resp.Data)
	}
}

// TestWriteJSON_ErrorViaWriteJSON tests error responses via WriteJSON directly
func TestWriteJSON_ErrorViaWriteJSON(t *testing.T) {
	rec := httptest.NewRecorder()

	utils.WriteJSON(rec, http.StatusUnauthorized, nil, "unauthorized")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %s", ct)
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if resp.Success {
		t.Errorf("expected success=false, got true")
	}
	if resp.Message != "unauthorized" {
		t.Errorf("expected message 'unauthorized', got %q", resp.Message)
	}
	if resp.Code != http.StatusUnauthorized {
		t.Errorf("expected code %d, got %d", http.StatusUnauthorized, resp.Code)
	}
	if resp.Data != nil {
		t.Errorf("expected data to be nil for error responses, got %v", resp.Data)
	}
}
