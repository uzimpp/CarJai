package routes

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminRoutes sets up admin authentication routes
func AdminRoutes(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	// เพิ่ม ExtractionService เข้ามาเพื่อสร้าง Handler สำหรับการนำเข้าข้อมูล
	extractionService *services.ExtractionService,
	adminPrefix string,
	allowedOrigins []string,
	allowedIPs []string,
) *http.ServeMux {
	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)

	// Create handler instances
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)
	// สร้าง Handler ใหม่สำหรับ Extraction
	adminExtractionHandler := handlers.NewAdminExtractionHandler(extractionService)

	// Create router
	router := http.NewServeMux()
	// กำหนด basePath ให้เป็น adminPrefix ที่ตัด "/" ท้ายออก
	basePath := strings.TrimSuffix(adminPrefix, "/")

	// --- Admin Authentication Routes ---

	// Admin authentication routes (POST) - Signin
	router.HandleFunc(basePath+"/auth/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoginRateLimit()(
						middleware.LoggingMiddleware( // ใช้ LoggingMiddleware
							adminAuthHandler.Signin,
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (POST) - Signout (Protected)
	router.HandleFunc(basePath+"/auth/signout",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware( // ใช้ AdminLoggingMiddleware
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminAuthHandler.Signout,
							),
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (GET) - Me (Protected)
	router.HandleFunc(basePath+"/auth/me",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminAuthHandler.Me,
							),
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (POST) - RefreshToken (Protected)
	router.HandleFunc(basePath+"/auth/refresh",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminAuthHandler.RefreshToken,
							),
						),
					),
				),
			),
		),
	)

	// --- Admin IP Whitelist Management Routes (Protected) ---

	// Admin IP whitelist management routes (GET)
	router.HandleFunc(basePath+"/ip-whitelist",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.GetWhitelistedIPs,
							),
						),
					),
				),
			),
		),
	)

	// Admin IP whitelist management routes (POST)
	router.HandleFunc(basePath+"/ip-whitelist/add",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.AddIPToWhitelist,
							),
						),
					),
				),
			),
		),
	)

	// Admin IP whitelist management routes (DELETE)
	router.HandleFunc(basePath+"/ip-whitelist/remove",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.AdminLoggingMiddleware(
						authMiddleware.RequireAuth(
							authMiddleware.RequireIPWhitelist(
								adminIPHandler.RemoveIPFromWhitelist,
							),
						),
					),
				),
			),
		),
	)

	// --- *** Market Price Import Route (New) *** ---
	// Admin Market Price Import route (POST)
	router.HandleFunc(basePath+"/market-price/import",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.GeneralRateLimit()( // เพิ่ม Rate Limit สำหรับ API ทั่วไปของแอดมิน
						middleware.AdminLoggingMiddleware(
							authMiddleware.RequireAuth(
								authMiddleware.RequireIPWhitelist(
									adminExtractionHandler.HandleImportMarketPrices, // Handler สำหรับนำเข้าข้อมูลราคาตลาด
								),
							),
						),
					),
				),
			),
		),
	)
	// --- *** สิ้นสุด Route ใหม่ *** ---

	// Health check for admin (GET)
	router.HandleFunc(basePath+"/health",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)( // เช็ค Global IP Whitelist เท่านั้น
					http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						w.WriteHeader(http.StatusOK)
						fmt.Fprintln(w, "Admin OK")
					}),
				),
			),
		),
	)

	// Route for any other admin paths (GET) - สำหรับให้ frontend ของ admin ทำ routing ต่อไป
	router.HandleFunc(basePath+"/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					func(w http.ResponseWriter, r *http.Request) {
						// ตอบกลับ OK สำหรับ path ที่ตรงกับ root ของ admin api
						if r.URL.Path == basePath+"/" {
							w.WriteHeader(http.StatusOK)
							w.Write([]byte("Admin API Root"))
							return
						}
						// ถ้า path ไม่ตรงกับ route ที่กำหนดไว้ทั้งหมด (แต่ยังขึ้นต้นด้วย basePath) จะตอบกลับ 404
						http.NotFound(w, r)
					},
				),
			),
		),
	)

	return router
}