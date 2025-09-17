package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/handlers"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/services"
)

// UserAuthRoutes sets up user authentication routes
func UserAuthRoutes(
	userService *services.UserService,
	corsAllowedOrigins string,
) *http.ServeMux {

	// Create handler instance
	userAuthHandler := handlers.NewUserAuthHandler(userService)

	// Create router
	router := http.NewServeMux()

	// User authentication routes (no auth required)
	router.HandleFunc("/api/auth/signup",
		middleware.CORSMiddleware(corsAllowedOrigins)(
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
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Login,
					),
				),
			),
		),
	)

	// Google login
	router.HandleFunc("/api/auth/google/login",
		middleware.CORSMiddleware(corsAllowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()( // reuse login rate limit
					middleware.LoggingMiddleware(
						userAuthHandler.GoogleLogin,
					),
				),
			),
		),
	)

	// User authentication routes (auth required)
	router.HandleFunc("/api/auth/logout",
		middleware.CORSMiddleware(corsAllowedOrigins)(
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
		middleware.CORSMiddleware(corsAllowedOrigins)(
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
		middleware.CORSMiddleware(corsAllowedOrigins)(
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
