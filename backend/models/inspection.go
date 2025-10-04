package models

// ScrapeRequest defines the structure for the incoming scrape request body
type ScrapeRequest struct {
	URL string `json:"url" binding:"required"`
}

// InspectionData defines the structure for the scraped inspection data response
type InspectionData struct {
	ReferenceNo  string `json:"reference_no"`
	ResultDate   string `json:"result_date"`
	LicensePlate string `json:"license_plate"`
	Province     string `json:"province"`
	Type         string `json:"type"`
	Status       string `json:"status"`
	ExpiryDate   string `json:"expiry_date"`
}