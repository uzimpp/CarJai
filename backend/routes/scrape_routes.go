// routes/scrape_routes.go
package routes

import (
	"encoding/json"
	"net/http"

	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

type scrapeRequest struct {
	URL string `json:"url"`
}

// ScrapeRoutes configures the routes for the scraper feature.
func ScrapeRoutes(scraperService *services.ScraperService, allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()

	// Handler หลักสำหรับ /api/scrape/
	scrapeHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			utils.WriteJSONError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		var req scrapeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteJSONError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		if req.URL == "" {
			utils.WriteJSONError(w, http.StatusBadRequest, "URL is required")
			return
		}

		data, err := scraperService.ScrapeInspectionData(req.URL)
		if err != nil {
			utils.WriteJSONError(w, http.StatusInternalServerError, err.Error())
			return
		}

		utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"success": true, "data": data})
	})

	// กำหนด Path และ Middleware (CORS)
	mux.Handle("/api/scrape/", middleware.EnableCORS(scrapeHandler, allowedOrigins))

	return mux
}