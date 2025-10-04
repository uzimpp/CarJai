package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/gocolly/colly/v2"
	"github.com/uzimpp/CarJai/backend/models" // <--- แก้ไข path ให้ตรงกับโปรเจคของคุณ
)

// ScrapeInspectionData handles the web scraping of DLT inspection data.
func ScrapeInspectionData(w http.ResponseWriter, r *http.Request) {
	// --- CORS Header ---
	w.Header().Set("Access-Control-Allow-Origin", "*") // Or specific origin

	// --- Method Check ---
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.ScrapeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// --- Validation & Scraper Logic (เหมือนเดิม) ---
	if !strings.HasPrefix(req.URL, "https://v6inspection.dlt.go.th") {
		http.Error(w, "Invalid or non-DLT inspection URL provided.", http.StatusBadRequest)
		return
	}

	collector := colly.NewCollector()
	data := models.InspectionData{}
	found := false

	collector.OnHTML("table tr", func(e *colly.HTMLElement) {
		// ... Logic การ Scrape เหมือนเดิมเป๊ะ ...
		label := strings.TrimSpace(e.ChildText("td:nth-child(1)"))
		value := strings.TrimSpace(e.ChildText("td:nth-child(2)"))

		switch {
		case strings.Contains(label, "เลขที่อ้างอิง"):
			data.ReferenceNo = value; found = true
		case strings.Contains(label, "วันที่ส่งผลการตรวจ"):
			data.ResultDate = value; found = true
		case strings.Contains(label, "หมายเลขทะเบียน"):
			data.LicensePlate = value; found = true
		case strings.Contains(label, "จังหวัด"):
			data.Province = value; found = true
		case strings.Contains(label, "ประเภท"):
			data.Type = value; found = true
		case strings.Contains(label, "สรุปผลการตรวจสภาพ"):
			data.Status = value; found = true
		case strings.Contains(label, "ผลการรับรองให้ใช้ได้ถึงวันที่"):
			if parts := strings.Split(label, "วันที่"); len(parts) > 1 {
				data.ExpiryDate = strings.TrimSpace(parts[1]); found = true
			}
		}
	})

	collector.OnError(func(r *colly.Response, err error) {
		log.Printf("Request URL: %s failed with response: %v\nError: %s\n", r.Request.URL, r, err)
	})

	err := collector.Visit(req.URL)

	// --- Response Handling ---
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Could not initiate scraping process."})
		return
	}
	if !found {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Could not extract any data. The website structure might have changed."})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    data,
	})
}