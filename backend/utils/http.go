package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type Response struct {
	Success bool        `json:"success"`
	Code    int         `json:"code"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// WriteJSON writes a type-safe JSON response with automatic wrapping.
//
// Response formats:
//   - Success (statusCode < 400): {success: true, data: T, message: string, code: int}
//   - Error (statusCode >= 400): {success: false, message: string, code: int}
//
// For errors, use WriteError() which is a convenience wrapper.
func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	isError := statusCode >= 400
	response := Response{
		Success: !isError,
		Code:    statusCode,
		Message: message,
	}
	// Only include data for successful responses when data is not nil
	if !isError && data != nil {
		response.Data = data
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

// WriteError writes a standardized JSON error response.
func WriteError(w http.ResponseWriter, statusCode int, message string) {
	WriteJSON(w, statusCode, nil, message)
}

// ExtractIDFromPath extracts an integer ID from a URL path by removing a prefix
// and truncating at the next slash. Useful for routes like /api/cars/{id} or /api/cars/{id}/images
func ExtractIDFromPath(path, prefix string) (int, error) {
	// Remove prefix
	idStr := strings.TrimPrefix(path, prefix)
	// Remove anything after the ID (like /images)
	if idx := strings.Index(idStr, "/"); idx != -1 {
		idStr = idStr[:idx]
	}
	// Parse ID
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, fmt.Errorf("invalid ID format")
	}
	return id, nil
}
