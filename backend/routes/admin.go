package routes

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminRoutes sets up admin authentication routes
func AdminRoutes(
	adminService *services.AdminService,
	userService *services.UserService,
	carService *services.CarService,
	jwtManager *utils.JWTManager,
	// Add ExtractionService
	extractionService *services.ExtractionService,
	reportService *services.ReportService,
	adminPrefix string,
	allowedOrigins []string,
	allowedIPs []string,
) *http.ServeMux {
	// Create middleware instances
	authMiddleware := middleware.NewAuthMiddleware(adminService, jwtManager)

	// Create handler instances
	adminAuthHandler := handlers.NewAdminAuthHandler(adminService, jwtManager, authMiddleware)
	adminIPHandler := handlers.NewAdminIPHandler(adminService)
	// Create Handler for Extraction
	adminExtractionHandler := handlers.NewAdminExtractionHandler(extractionService)
	// Create Handler for Reports
	adminReportsHandler := handlers.NewAdminReportsHandler(reportService, userService, carService, adminService)
	// Create Handler for user and car management
	adminUserHandler := handlers.NewAdminUserHandler(adminService, userService)
	adminCarHandler := handlers.NewAdminCarHandler(carService)

	// Create Handler for Dashboard
	adminDashboardHandler := handlers.NewAdminDashboardHandler(userService, carService, reportService)

	// Create router
	router := http.NewServeMux()
	basePath := strings.TrimSuffix(adminPrefix, "/")

	// --- Middleware Chain Helper (for brevity) ---
	applyAdminAuthMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
		// Middleware chain for fully protected admin routes requiring authentication and IP whitelist
		return middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.GeneralRateLimit()( // Add general rate limit
						middleware.AdminLoggingMiddleware( // Use Admin logging
							authMiddleware.RequireAuth(
								authMiddleware.RequireIPWhitelist(
									handler,
								),
							),
						),
					),
				),
			),
		)
	}

	requireSuperAdmin := func(handler http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            adminIDStr := r.Header.Get("X-Admin-ID")
            if adminIDStr == "" {
                utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
                return
            }

            adminID, _ := strconv.Atoi(adminIDStr) 
            
            admin, err := adminService.GetAdminByID(adminID)
            if err != nil {
                utils.WriteError(w, http.StatusUnauthorized, "User not found")
                return
            }

            if admin.Role != "super_admin" {
                utils.WriteError(w, http.StatusForbidden, "Access denied: Super Admin only")
                return
            }

            handler(w, r)
        }
    }

	applySuperAdminAuthMiddleware := func(handler http.HandlerFunc) http.HandlerFunc {
        return middleware.CORSMiddleware(allowedOrigins)(
            middleware.SecurityHeadersMiddleware(
                authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
                    middleware.GeneralRateLimit()(
                        middleware.AdminLoggingMiddleware(
                            authMiddleware.RequireAuth(
                                authMiddleware.RequireIPWhitelist(		
                                    requireSuperAdmin(handler),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        )
    }

	// --- Admin Authentication Routes ---
	// Signin needs special handling (LoginRateLimit, no auth required yet)
	router.HandleFunc(basePath+"/auth/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoginRateLimit()( // Specific rate limit for login
						middleware.LoggingMiddleware( // Use general logging for potentially unauthenticated requests
							adminAuthHandler.Signin,
						),
					),
				),
			),
		),
	)
	// Other auth routes use the standard protected middleware chain
	router.HandleFunc(basePath+"/auth/signout", applyAdminAuthMiddleware(adminAuthHandler.Signout))
	router.HandleFunc(basePath+"/auth/me", applyAdminAuthMiddleware(adminAuthHandler.Me))
	router.HandleFunc(basePath+"/auth/refresh", applyAdminAuthMiddleware(adminAuthHandler.RefreshToken))

	router.HandleFunc(basePath+"/admins",
		applySuperAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != basePath+"/admins" {
                 return 
			}
			switch r.Method {
			case http.MethodGet:
				adminAuthHandler.HandleGetAdmins(w, r)
			case http.MethodPost:
				adminAuthHandler.HandleCreateAdmin(w, r)
			default:
				utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		}),
	)

	router.HandleFunc(basePath+"/admins/",
        applySuperAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
            // Check method
            switch r.Method {
            case http.MethodPatch:
                adminAuthHandler.HandleUpdateAdmin(w, r)
            case http.MethodDelete:
                adminAuthHandler.HandleDeleteAdmin(w, r)
            default:
                utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
            }
        }),
    )

	// --- Admin IP Whitelist Management Routes ---
	router.HandleFunc(basePath+"/ip-whitelist", applyAdminAuthMiddleware(adminIPHandler.GetWhitelistedIPs))
	router.HandleFunc(basePath+"/ip-whitelist/add", applyAdminAuthMiddleware(adminIPHandler.AddIPToWhitelist))
	router.HandleFunc(basePath+"/ip-whitelist/check", applyAdminAuthMiddleware(adminIPHandler.CheckIPDeletionImpact))
	router.HandleFunc(basePath+"/ip-whitelist/remove", applyAdminAuthMiddleware(adminIPHandler.RemoveIPFromWhitelist))

	// --- Admin Dashboard Routes ---
	router.HandleFunc(basePath+"/dashboard/stats",
		applyAdminAuthMiddleware(adminDashboardHandler.HandleGetStats),
	)

	router.HandleFunc(basePath+"/dashboard/chart",
		applyAdminAuthMiddleware(adminDashboardHandler.HandleGetChartData),
	)

	router.HandleFunc(basePath+"/dashboard/top-brands",
		applyAdminAuthMiddleware(adminDashboardHandler.HandleGetTopBrandsChart),
	)

	router.HandleFunc(basePath+"/dashboard/recent-reports",
		applyAdminAuthMiddleware(adminDashboardHandler.HandleGetRecentReports),
	)

	// --- Market Price Routes ---
	// GET: Retrieve all market prices from the database
	// POST: Upload PDF and directly import to database
	router.HandleFunc(basePath+"/market-price/data",
		applyAdminAuthMiddleware(adminExtractionHandler.HandleGetMarketPrices))

	router.HandleFunc(basePath+"/market-price/upload",
		applyAdminAuthMiddleware(adminExtractionHandler.HandleImportMarketPrices))

	// --- Admin Reports Routes ---
	// Handler for action routes with IDs: /admin/reports/{id}/resolve, /admin/reports/{id}/dismiss
	router.HandleFunc(basePath+"/reports/",
		applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if strings.HasSuffix(path, "/resolve") && r.Method == http.MethodPost {
				adminReportsHandler.ResolveReport(w, r)
			} else if strings.HasSuffix(path, "/dismiss") && r.Method == http.MethodPost {
				adminReportsHandler.DismissReport(w, r)
			} else {
				http.NotFound(w, r)
			}
		}))
	
	// Handler for list endpoint: GET /admin/reports
	router.HandleFunc(basePath+"/reports",
		applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet {
				adminReportsHandler.ListReports(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}))
	
    
	// GET /admin/users (List users)
	// POST /admin/users (Create user)
	router.HandleFunc(basePath+"/users",
		applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				adminUserHandler.HandleGetUsers(w, r)
			case http.MethodPost:
				adminUserHandler.HandleCreateUser(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}),
	)

    router.HandleFunc(basePath+"/users/",
        applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
            path := r.URL.Path
            if strings.HasSuffix(path, "/ban") && r.Method == http.MethodPost {
                adminReportsHandler.BanUser(w, r)
                return
            }
            switch r.Method {
			case http.MethodGet:
                adminUserHandler.HandleGetUser(w, r)
            case http.MethodPatch:
                adminUserHandler.HandleUpdateUser(w, r)
            case http.MethodDelete:
                adminUserHandler.HandleDeleteUser(w, r)
            default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
            }
        }),
    )

	// --- Admin Car Management Routes ---
	// GET /admin/cars
	router.HandleFunc(basePath+"/cars",
		applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodGet:
				adminCarHandler.HandleGetCars(w, r)
			case http.MethodPost:
				adminCarHandler.HandleCreateCar(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}),
	)

    router.HandleFunc(basePath+"/cars/",
        applyAdminAuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
            path := r.URL.Path
            if strings.HasSuffix(path, "/remove") && r.Method == http.MethodPost {
                adminReportsHandler.RemoveCar(w, r)
                return
            }
            switch r.Method {
            case http.MethodPatch:
                adminCarHandler.HandleUpdateCar(w, r)
            case http.MethodDelete:
                adminCarHandler.HandleDeleteCar(w, r)
            default:
                http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
            }
        }),
    )

	// --- Health Check & Root ---
	// Health check and Root only need Global IP Whitelist and general logging
	router.HandleFunc(basePath+"/health",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoggingMiddleware( // Use general logging
						func(w http.ResponseWriter, r *http.Request) {
							w.WriteHeader(http.StatusOK)
							fmt.Fprintln(w, "Admin OK")
						},
					),
				),
			),
		),
	)
	router.HandleFunc(basePath+"/",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				authMiddleware.RequireGlobalIPWhitelist(allowedIPs)(
					middleware.LoggingMiddleware( // Use general logging
						func(w http.ResponseWriter, r *http.Request) {
							if r.URL.Path == basePath+"/" {
								w.WriteHeader(http.StatusOK)
								w.Write([]byte("Admin API Root"))
							} else {
								http.NotFound(w, r) // Return 404 for other unmatched paths under /admin/
							}
						},
					),
				),
			),
		),
	)

	return router
}
