package routes

import (
    "net/http"
    "strings"

    "github.com/uzimpp/CarJai/backend/handlers"
    "github.com/uzimpp/CarJai/backend/middleware"
    "github.com/uzimpp/CarJai/backend/services"
)

// ReportRoutes sets up routes for reporting cars and sellers
func ReportRoutes(reportService *services.ReportService, userService *services.UserService, allowedOrigins []string) *http.ServeMux {
    router := http.NewServeMux()

    handler := handlers.NewReportHandler(reportService, userService)
    corsMiddleware := middleware.CORSMiddleware(allowedOrigins)
    authMiddleware := middleware.NewUserAuthMiddleware(userService)

    router.HandleFunc("/api/reports/", func(w http.ResponseWriter, r *http.Request) {
        path := r.URL.Path

        // POST /api/reports/cars/{id}
        if strings.HasPrefix(path, "/api/reports/cars/") && r.Method == http.MethodPost {
            corsMiddleware(
                middleware.SecurityHeadersMiddleware(
                    middleware.GeneralRateLimit()(
                        middleware.LoggingMiddleware(
                            authMiddleware.RequireAuth(handler.SubmitCarReport),
                        ),
                    ),
                ),
            )(w, r)
            return
        }

        // POST /api/reports/sellers/{id}
        if strings.HasPrefix(path, "/api/reports/sellers/") && r.Method == http.MethodPost {
            corsMiddleware(
                middleware.SecurityHeadersMiddleware(
                    middleware.GeneralRateLimit()(
                        middleware.LoggingMiddleware(
                            authMiddleware.RequireAuth(handler.SubmitSellerReport),
                        ),
                    ),
                ),
            )(w, r)
            return
        }

        http.Error(w, "Not found", http.StatusNotFound)
    })

    return router
}