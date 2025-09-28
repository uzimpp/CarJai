package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// APIResponse เป็น struct กลางสำหรับตอบกลับ
type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type OCRResultData struct {
	ExtractedText string `json:"extracted_text"`
}

// ocrUploadHandler คือ handler ที่จัดการการอัปโหลดไฟล์
func ocrUploadHandler(ocrService *services.OCRService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user information from context (set by auth middleware)
		user, ok := middleware.GetUserFromContext(r)
		if !ok {
			sendJSONError(w, "User not found in request context.", http.StatusInternalServerError)
			return
		}

		log.Printf("Received new OCR request from user: %s (ID: %d)", user.Email, user.ID)

		// --- จุดที่แก้ไข ---
		// คำนวณ 5.5 MB ให้เป็นจำนวนเต็มของ bytes ก่อน
		// 1 MB = 1024 * 1024 bytes
		const maxUploadSize = int64(5.5 * 1024 * 1024)

		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			sendJSONError(w, "File is too large.", http.StatusBadRequest)
			return
		}
		// --- สิ้นสุดจุดที่แก้ไข ---

		file, handler, err := r.FormFile("file")
		if err != nil {
			sendJSONError(w, "Invalid 'file' field in form.", http.StatusBadRequest)
			return
		}
		defer file.Close()

		extractedText, err := ocrService.ExtractTextFromFile(file, handler)
		if err != nil {
			log.Printf("OCR service error for user %s: %v", user.Email, err)
			sendJSONError(w, "Failed to process document.", http.StatusInternalServerError)
			return
		}

		log.Printf("OCR processing completed for user: %s", user.Email)
		sendJSONSuccess(w, OCRResultData{ExtractedText: extractedText}, http.StatusOK)
	}
}

// OCRRoutes สร้าง router สำหรับฟีเจอร์ OCR
func OCRRoutes(ocrService *services.OCRService, userService *services.UserService, userJWTManager *utils.JWTManager, allowedOrigins []string) http.Handler {
	// Create user auth middleware
	userAuthMiddleware := middleware.NewUserAuthMiddleware(userService)

	// Create router
	router := http.NewServeMux()

	// OCR upload endpoint with user authentication required
	router.HandleFunc("/api/ocr/verify-document",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthMiddleware.RequireAuth(
							ocrUploadHandler(ocrService),
						),
					),
				),
			),
		),
	)

	return router
}

// Helper functions for sending JSON responses
func sendJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(APIResponse{Status: "error", Message: message})
}

func sendJSONSuccess(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(APIResponse{Status: "success", Data: data})
}
