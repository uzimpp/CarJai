package models

// APIResponse represents the wrapped API response format for type-safe testing
// Format: {success: true, data: T, message: string, code: int}
type APIResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// APIErrorResponse represents the wrapped API error response format
// Format: {success: false, message: string, code: int}
type APIErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}
