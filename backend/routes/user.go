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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.Signup(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.Signin(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.GoogleSignin(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodGet {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.GoogleStart(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodGet {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.GoogleCallback(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.Signout(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodGet {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.Me(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.RefreshToken(w, r)
						},
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
						func(w http.ResponseWriter, r *http.Request) {
							if r.Method != http.MethodPost {
								utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
								return
							}
							userAuthHandler.ChangePassword(w, r)
						},
					),
				),
			),
		),
	)

	// Forgot password (POST)
	router.HandleFunc("/api/auth/forgot-password",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.ForgotPassword,
					),
				),
			),
		),
	)

	// Reset password (POST)
	router.HandleFunc("/api/auth/reset-password",
		middleware.CORSMiddleware(allowedOrigins)(
			middleware.SecurityHeadersMiddleware(
				middleware.GeneralRateLimit()(
					middleware.LoggingMiddleware(
						userAuthHandler.ResetPassword,
					),
				),
			),
		),
	)

	return router
}
