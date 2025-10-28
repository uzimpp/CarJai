package routes

import (
	"fmt" // *** เพิ่ม fmt (ถ้ายังไม่มี) ***
	"net/http"
	"strings" // *** เพิ่ม strings (ถ้ายังไม่มี) ***

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminRoutes sets up admin authentication routes
func AdminRoutes(
	adminService *services.AdminService,
	jwtManager *utils.JWTManager,
	// *** เพิ่ม ExtractionService เข้ามาเพื่อสร้าง Handler ***
	extractionService *services.ExtractionService,
	adminPrefix string,
	allowedOrigins []string,
	allowedIPs []string,
) *http.ServeMux { // *** ใช้ *http.ServeMux ตามต้นฉบับ ***

	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)

	// Create handler instances *** สร้าง Handler ทั้งหมดที่นี่ ***
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)
	// *** สร้าง Handler ใหม่สำหรับ Extraction ***
	adminExtractionHandler := handlers.NewAdminExtractionHandler(extractionService)

	// Create router
	router := http.NewServeMux()
	// *** เพิ่ม basePath ***
	basePath := strings.TrimSuffix(adminPrefix, "/")

	// Admin authentication routes (POST) - Signin
	router.HandleFunc(basePath+"/auth/signin", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoginRateLimit()(
						middleware.LoggingMiddleware( // ใช้ LoggingMiddleware ทั่วไป
							adminAuthHandler.Signin,
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (POST) - Signout
	router.HandleFunc(basePath+"/auth/signout", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware( // ใช้ AdminLoggingMiddleware
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
						middleware.GeneralRateLimit()(
							authMiddleware.RequireAuth(
								authMiddleware.RequireIPWhitelist(
									adminAuthHandler.Signout,
								),
							),
						),
					),
				),
			),
		),
	)

	// Admin authentication routes (GET) - Me
	router.HandleFunc(basePath+"/auth/me", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
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

	// Admin authentication routes (POST) - Refresh Token
	router.HandleFunc(basePath+"/auth/refresh", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware(
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
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

	// Admin IP whitelist management routes (GET) - Get IPs
	router.HandleFunc(basePath+"/ip-whitelist", // *** ใช้ basePath ***
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

	// Admin IP whitelist management routes (POST) - Add IP
	router.HandleFunc(basePath+"/ip-whitelist/add", // *** ใช้ basePath ***
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

	// Admin IP whitelist management routes (DELETE) - Remove IP
	router.HandleFunc(basePath+"/ip-whitelist/remove", // *** ใช้ basePath ***
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

	// --- *** Route ใหม่สำหรับ Market Price Import *** ---
	router.HandleFunc(basePath+"/market-price/import", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.AdminLoggingMiddleware( // ใช้ Middleware chain เหมือน route อื่นๆ
					authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
						authMiddleware.RequireAuth( // ต้อง Login
							authMiddleware.RequireIPWhitelist( // Check IP ของ Admin ที่ login แล้ว
								adminExtractionHandler.HandleImportMarketPrices, // เรียก Handler ใหม่
							),
						),
					),
				),
			),
		),
	)
	// --- *** สิ้นสุด Route ใหม่ *** ---

	// Health check for admin (ใส่เพิ่มเข้ามา)
	router.HandleFunc(basePath+"/health", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)( // อาจจะไม่ต้อง check IP/Auth สำหรับ health
					http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						w.WriteHeader(http.StatusOK)
						fmt.Fprintln(w, "Admin OK")
					}),
				),
			),
		),
	)

	// Route for any other admin paths (GET) - ใช้ basePath
	router.HandleFunc(basePath+"/", // *** ใช้ basePath ***
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					func(w http.ResponseWriter, r *http.Request) {
						// ทำให้ path "/" ตอบกลับ OK, path อื่นๆ ที่ไม่ตรงจะ 404 โดย ServeMux เอง
						if r.URL.Path == basePath+"/" {
							w.WriteHeader(http.StatusOK)
							w.Write([]byte("Admin API Root")) // ใช้ข้อความเดิมของคุณ
						} else {
							http.NotFound(w, r)
						}
					},
				),
			),
		),
	)

	return router
}