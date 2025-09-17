package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
)

// UserAuthMiddleware provides authentication middleware for user routes
type UserAuthMiddleware struct {
	userService *services.UserService
}

// NewUserAuthMiddleware creates a new user auth middleware
func NewUserAuthMiddleware(userService *services.UserService) *UserAuthMiddleware {
	return &UserAuthMiddleware{
		userService: userService,
	}
}

// RequireAuth is a middleware that requires valid user authentication
func (m *UserAuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get token from jwt cookie
		cookie, err := r.Cookie("jwt")
		if err != nil {
			response := models.UserErrorResponse{
				Success: false,
				Error:   "Authentication required",
				Code:    http.StatusUnauthorized,
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(response)
			return
		}
		token := cookie.Value

		// Validate user session
		user, err := m.userService.ValidateUserSession(token)
		if err != nil {
			response := models.UserErrorResponse{
				Success: false,
				Error:   "Invalid or expired token",
				Code:    http.StatusUnauthorized,
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(response)
			return
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), "user", user)
		ctx = context.WithValue(ctx, "userID", user.ID)
		ctx = context.WithValue(ctx, "userEmail", user.Email)
		ctx = context.WithValue(ctx, "token", token)

		// Call next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// RequireAuthHandler is a middleware that requires valid user authentication and returns a handler
func (m *UserAuthMiddleware) RequireAuthHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from jwt cookie
		cookie, err := r.Cookie("jwt")
		if err != nil {
			response := models.UserErrorResponse{
				Success: false,
				Error:   "Authentication required",
				Code:    http.StatusUnauthorized,
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(response)
			return
		}
		token := cookie.Value

		// Validate user session
		user, err := m.userService.ValidateUserSession(token)
		if err != nil {
			response := models.UserErrorResponse{
				Success: false,
				Error:   "Invalid or expired token",
				Code:    http.StatusUnauthorized,
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(response)
			return
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), "user", user)
		ctx = context.WithValue(ctx, "userID", user.ID)
		ctx = context.WithValue(ctx, "userEmail", user.Email)
		ctx = context.WithValue(ctx, "token", token)

		// Call next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserFromContext extracts user from request context
func GetUserFromContext(r *http.Request) (*models.User, bool) {
	user, ok := r.Context().Value("user").(*models.User)
	return user, ok
}

// GetUserIDFromContext extracts user ID from request context
func GetUserIDFromContext(r *http.Request) (int, bool) {
	userID, ok := r.Context().Value("userID").(int)
	return userID, ok
}

// GetUserEmailFromContext extracts user email from request context
func GetUserEmailFromContext(r *http.Request) (string, bool) {
	email, ok := r.Context().Value("userEmail").(string)
	return email, ok
}

// GetTokenFromContext extracts token from request context
func GetTokenFromContext(r *http.Request) (string, bool) {
	token, ok := r.Context().Value("token").(string)
	return token, ok
}

// OptionalAuth is a middleware that validates authentication if present but doesn't require it
func (m *UserAuthMiddleware) OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get token from jwt cookie
		cookie, err := r.Cookie("jwt")
		if err == nil {
			token := cookie.Value
			if token != "" {
				// Try to validate user session
				user, err := m.userService.ValidateUserSession(token)
				if err == nil {
					// Add user to request context if valid
					ctx := context.WithValue(r.Context(), "user", user)
					ctx = context.WithValue(ctx, "userID", user.ID)
					ctx = context.WithValue(ctx, "userEmail", user.Email)
					ctx = context.WithValue(ctx, "token", token)
					r = r.WithContext(ctx)
				}
			}
		}

		// Call next handler
		next.ServeHTTP(w, r)
	}
}

