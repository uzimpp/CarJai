package routes

import (
	"net/http"

	"github.com/uzimpp/CarJai/backend/config"
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
	appConfig *config.AppConfig,
) *http.ServeMux {

	// Create handler instance
	userAuthHandler := handlers.NewUserAuthHandler(userService, appConfig)

	// Create router
	router := http.NewServeMux()

	// User authentication routes (POST)
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

	// User authentication routes (POST)
	router.HandleFunc("/api/auth/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Signin,
					),
				),
			),
		),
	)

	// Google OAuth: direct ID token sign-in (POST)
	router.HandleFunc("/api/auth/google/signin",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.GoogleSignin,
					),
				),
			),
		),
	)

	// Google OAuth: start authorization (GET)
	router.HandleFunc("/api/auth/google/start",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.GoogleStart,
					),
				),
			),
		),
	)

	// Google OAuth: callback (GET)
	router.HandleFunc("/api/auth/google/callback",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.GoogleCallback,
					),
				),
			),
		),
	)

	// User authentication routes (POST)
	router.HandleFunc("/api/auth/signout",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.Signout,
					),
				),
			),
		),
	)

	// User authentication routes (GET)
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

	// User authentication routes (POST)
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

	// Change password (POST)
	router.HandleFunc("/api/auth/change-password",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.ChangePassword,
					),
				),
			),
		),
	)

	return router
}
