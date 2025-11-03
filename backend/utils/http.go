package utils

import (
	"encoding/json"
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
)

// WriteJSON writes any data as JSON with the given status code.
func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// RespondJSON is an alias for WriteJSON for consistency
func RespondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	WriteJSON(w, statusCode, data)
}

// WriteError writes a standardized admin JSON error response.
// Note: This function is primarily used for Admin API errors.
func WriteError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}

	json.NewEncoder(w).Encode(response)
}

// WriteJSONError writes a simple JSON error response (e.g., for non-admin/user API)
func WriteJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := map[string]interface{}{
		"success": false,
		"message": message,
	}

	json.NewEncoder(w).Encode(response)
}