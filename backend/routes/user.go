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
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
						userAuthHandler.Signup,
					),
				),
			),
		),
	)

	// User authentication routes (POST)
	router.HandleFunc("/api/auth/signin",
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.LoginRateLimit()(
						userAuthHandler.Signin,
					),
				),
			),
		),
	)

	router.HandleFunc("/api/auth/google",
		middleware.LoggingMiddleware(
			middleware.CORSMiddleware(allowedOrigins)(
				middleware.SecurityHeadersMiddleware(
					middleware.LoginRateLimit()(
						userAuthHandler.GoogleAuth,
					),
				),
			),
		),
	)

	// User authentication routes (POST)
	router.HandleFunc("/api/auth/signout",
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
						userAuthHandler.Signout,
					),
				),
			),
		),
	)

	// User authentication routes (GET)
	router.HandleFunc("/api/auth/me",
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
						userAuthHandler.Me,
					),
				),
			),
		),
	)

	// User authentication routes (POST)
	router.HandleFunc("/api/auth/refresh",
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
						userAuthHandler.RefreshToken,
					),
				),
			),
		),
	)

	// Change password (POST)
	router.HandleFunc("/api/auth/change-password",
	middleware.LoggingMiddleware(
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
						userAuthHandler.ChangePassword,
					),
				),
			),
		),
	)

	return router
}
