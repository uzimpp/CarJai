package models

import (
	"time"
)

// User represents a regular user in the system
type User struct {
	ID           int       `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// UserSession represents an active user session
type UserSession struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// UserSignupRequest represents the request payload for user signup
type UserSignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// UserLoginRequest represents the request payload for user login
type UserLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// UserGoogleLoginRequest represents the request payload for Google login
type UserGoogleLoginRequest struct {
	IDToken string `json:"id_token" validate:"required"`
}

// UserAuthResponse represents the response payload for successful authentication
type UserAuthResponse struct {
	Success bool         `json:"success"`
	Data    UserAuthData `json:"data"`
	Message string       `json:"message,omitempty"`
}

// UserAuthData contains the authentication data returned after login/signup
type UserAuthData struct {
	User      UserPublic `json:"user"`
	Token     string     `json:"token"`
	ExpiresAt time.Time  `json:"expires_at"`
}

// UserPublic represents user data that can be safely returned to client
type UserPublic struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// UserMeResponse represents the response payload for GET /api/auth/me
type UserMeResponse struct {
	Success bool       `json:"success"`
	Data    UserMeData `json:"data"`
}

// UserMeData contains the current user session information
type UserMeData struct {
	User UserPublic `json:"user"`
}

// UserLogoutResponse represents the response payload for user logout
type UserLogoutResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// UserErrorResponse represents error response structure
type UserErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
}

// ToPublic converts User to UserPublic (removes sensitive data)
func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:        u.ID,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
	}
}

// IsExpired checks if the user session has expired
func (s *UserSession) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsValid checks if the user session is valid (not expired)
func (s *UserSession) IsValid() bool {
	return !s.IsExpired()
}
