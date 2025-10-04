package models

import (
	"time"
)

// Admin represents an admin user in the system
type Admin struct {
	ID           int        `json:"id" db:"id"`
	Username     string     `json:"username" db:"username"`
	PasswordHash string     `json:"-" db:"password_hash"`
	Name         string     `json:"name" db:"name"`
	LastSigninAt *time.Time `json:"last_signin_at" db:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// AdminSession represents an active admin session
type AdminSession struct {
	ID        int       `json:"id" db:"id"`
	AdminID   int       `json:"admin_id" db:"admin_id"`
	Token     string    `json:"token" db:"token"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// AdminIPWhitelist represents an IP address whitelist entry for an admin
type AdminIPWhitelist struct {
	ID          int       `json:"id" db:"id"`
	AdminID     int       `json:"admin_id" db:"admin_id"`
	IPAddress   string    `json:"ip_address" db:"ip_address"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// AdminSigninRequest represents the request payload for admin sign in
type AdminSigninRequest struct {
	Username string `json:"username" validate:"required,min=3,max=100"`
	Password string `json:"password" validate:"required,min=6"`
}

// AdminSigninResponse represents the response payload for successful admin sign in
type AdminSigninResponse struct {
	Success bool          `json:"success"`
	Data    AdminAuthData `json:"data"`
	Message string        `json:"message,omitempty"`
}

// AdminAuthData contains the authentication data returned after sign in
type AdminAuthData struct {
	Admin     AdminPublic `json:"admin"`
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expires_at"`
}

// AdminPublic represents admin data that can be safely returned to client
type AdminPublic struct {
	ID           int        `json:"id"`
	Username     string     `json:"username"`
	Name         string     `json:"name"`
	LastSigninAt *time.Time `json:"last_signin_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// AdminSignoutRequest represents the request payload for admin sign out
type AdminSignoutRequest struct {
	Token string `json:"token" validate:"required"`
}

// AdminSignoutResponse represents the response payload for admin sign out
type AdminSignoutResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// AdminMeResponse represents the response payload for GET /admin/auth/me
type AdminMeResponse struct {
	Success bool        `json:"success"`
	Data    AdminMeData `json:"data"`
}

// AdminMeData contains the current admin session information
type AdminMeData struct {
	Admin   AdminPublic        `json:"admin"`
	Session AdminSessionPublic `json:"session"`
}

// AdminSessionPublic represents session data that can be safely returned to client
type AdminSessionPublic struct {
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

// AdminIPWhitelistRequest represents the request payload for adding IP to whitelist
type AdminIPWhitelistRequest struct {
	IPAddress   string `json:"ip_address" validate:"required"`
	Description string `json:"description" validate:"max=255"`
}

// AdminIPWhitelistResponse represents the response payload for IP whitelist operations
type AdminIPWhitelistResponse struct {
	Success bool               `json:"success"`
	Data    []AdminIPWhitelist `json:"data,omitempty"`
	Message string             `json:"message,omitempty"`
}

// AdminErrorResponse represents error response structure
type AdminErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
}

// ToPublic converts Admin to AdminPublic (removes sensitive data)
func (a *Admin) ToPublic() AdminPublic {
	return AdminPublic{
		ID:           a.ID,
		Username:     a.Username,
		Name:         a.Name,
		LastSigninAt: a.LastSigninAt,
		CreatedAt:    a.CreatedAt,
	}
}

// ToPublic converts AdminSession to AdminSessionPublic (removes sensitive data)
func (s *AdminSession) ToPublic() AdminSessionPublic {
	return AdminSessionPublic{
		IPAddress: s.IPAddress,
		UserAgent: s.UserAgent,
		CreatedAt: s.CreatedAt,
		ExpiresAt: s.ExpiresAt,
	}
}

// IsExpired checks if the session has expired
func (s *AdminSession) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsValid checks if the session is valid (not expired)
func (s *AdminSession) IsValid() bool {
	return !s.IsExpired()
}
