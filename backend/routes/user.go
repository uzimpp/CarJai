package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// UserAuthRoutes sets up user authentication routes
func UserAuthRoutes(
	userService *services.UserService,
	userJWTManager *utils.JWTManager,
	allowedOrigins []string,
) *http.ServeMux {

	// Create handler instance
	userAuthHandler := handlers.NewUserAuthHandler(userService)

	// Create router
	router := http.NewServeMux()

	// User authentication routes (no auth required)
	router.HandleFunc("/api/auth/signup",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Signup,
					),
				),
			),
		),
	)

	router.HandleFunc("/api/auth/login",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Login,
					),
				),
			),
		),
	)

	// User authentication routes (auth required)
	router.HandleFunc("/api/auth/logout",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Logout,
					),
				),
			),
		),
	)

	router.HandleFunc("/api/auth/me",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Me,
					),
				),
			),
		),
	)

	router.HandleFunc("/api/auth/refresh",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.RefreshToken,
					),
				),
			),
		),
	)

	return router
}
