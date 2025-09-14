package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/uzimpp/CarJai/backend/services" // <-- แก้ไข import path ให้ตรงกับโปรเจคของน้อง
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
		log.Println("Received new OCR request")

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
			log.Printf("OCR service error: %v", err)
			sendJSONError(w, "Failed to process document.", http.StatusInternalServerError)
			return
		}

		sendJSONSuccess(w, OCRResultData{ExtractedText: extractedText}, http.StatusOK)
	}
}

// OCRRoutes สร้าง router สำหรับฟีเจอร์ OCR
func OCRRoutes(ocrService *services.OCRService, corsAllowedOrigins []string) http.Handler {
	mux := http.NewServeMux()
	handler := ocrUploadHandler(ocrService)

	// เราจะใช้ Middleware สำหรับ CORS ที่นี่
	corsHandler := corsMiddleware(handler, corsAllowedOrigins)

	mux.Handle("/verify-document", corsHandler) // Endpoint: /api/v1/ocr/verify-document

	return mux
}

// corsMiddleware (อาจจะมีอยู่แล้วในโปรเจค, ถ้าไม่มีให้เพิ่มเข้าไป)
func corsMiddleware(next http.Handler, allowedOrigins []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		if isAllowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
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