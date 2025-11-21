package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ReportRoutes sets up routes for reporting cars and sellers
func ReportRoutes(reportService *services.ReportService, userService *services.UserService, allowedOrigins []string) *http.ServeMux {
	router := http.NewServeMux()

	handler := handlers.NewReportHandler(reportService, userService)
	authMiddleware := middleware.NewUserAuthMiddleware(userService)

	// POST /api/reports/cars/{id} - Report a car
	router.HandleFunc("/api/reports/cars/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							func(w http.ResponseWriter, r *http.Request) {
								if r.Method != http.MethodPost {
									utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
									return
								}
								handler.SubmitCarReport(w, r)
							},
						),
					),
				),
			),
		),
	)

	// POST /api/reports/sellers/{id} - Report a seller
	router.HandleFunc("/api/reports/sellers/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						authMiddleware.RequireAuth(
							func(w http.ResponseWriter, r *http.Request) {
								if r.Method != http.MethodPost {
									utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
									return
								}
								handler.SubmitSellerReport(w, r)
							},
						),
					),
				),
			),
		),
	)

	return router
}
