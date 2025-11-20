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
	Role         string     `json:"role" db:"role"`
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

// AdminAuthData contains the authentication data returned after sign in (used in services)
type AdminAuthData struct {
	Admin     AdminPublic `json:"admin"`
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expires_at"`
}

// AdminSigninResponse represents the data returned after admin sign in (API response only)
type AdminSigninResponse struct {
	Admin     AdminPublic `json:"admin"`
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expires_at"`
}

// AdminPublic represents admin data that can be safely returned to client
type AdminPublic struct {
	ID           int        `json:"id"`
	Username     string     `json:"username"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	LastSigninAt *time.Time `json:"last_signin_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// AdminSignoutRequest represents the request payload for admin sign out
type AdminSignoutRequest struct {
	Token string `json:"token" validate:"required"`
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

// AdminRefreshResponse represents the data returned after token refresh (API response only)
type AdminRefreshResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// IPDeletionImpactResponse represents the impact of deleting an IP from whitelist (API response only)
type IPDeletionImpactResponse struct {
	WouldBlockSession bool `json:"wouldBlockSession"`
}

// AdminAdminsListResponse is the response for GET /admin/admins
type AdminAdminsListResponse struct {
	Admins []AdminPublic `json:"admins"`
	Total  int           `json:"total"`
}

// AdminCreateRequest represents the payload for creating a new admin
type AdminCreateRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Password string `json:"password" validate:"required,min=8"`
}

// ToPublic converts Admin to AdminPublic (removes sensitive data)
func (a *Admin) ToPublic() AdminPublic {
	return AdminPublic{
		ID:           a.ID,
		Username:     a.Username,
		Name:         a.Name,
		Role:         a.Role,
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
