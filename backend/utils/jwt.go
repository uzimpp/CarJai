package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// UserRole represents the type of user
type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

// AuthMethod represents how the user authenticated
type AuthMethod string

const (
	AuthPassword AuthMethod = "password"
	AuthGoogle   AuthMethod = "google"
)

// TokenRequest contains all data needed to generate a JWT token
type TokenRequest struct {
	UserID     int        `json:"user_id"`
	Username   string     `json:"username"`
	Role       UserRole   `json:"role"`
	AuthMethod AuthMethod `json:"auth_method"`
	SessionID  string     `json:"session_id"`
}

// JWTClaims represents the JWT claims structure for unified user system
type JWTClaims struct {
	UserID     int    `json:"user_id"`      // Universal user ID (admin or regular user)
	Username   string `json:"username"`     // Username or email
	Role       string `json:"role"`         // "admin" | "user"
	AuthMethod string `json:"auth_method"`  // "password" | "google"
	SessionID  string `json:"session_id"`
	jwt.RegisteredClaims
}

// JWTManager handles JWT token operations
type JWTManager struct {
	secretKey     string
	tokenDuration time.Duration
	issuer        string
	allowedRoles  []UserRole
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(secretKey string, tokenDuration time.Duration, issuer string) *JWTManager {
	allowedRoles := []UserRole{RoleAdmin, RoleUser}
	return &JWTManager{
		secretKey:     secretKey,
		tokenDuration: tokenDuration,
		issuer:        issuer,
		allowedRoles:  allowedRoles,
	}
}

// GenerateToken generates a new JWT token using a structured request
func (j *JWTManager) GenerateToken(req TokenRequest) (string, time.Time, error) {
	// Validate required fields
	if req.UserID == 0 {
		return "", time.Time{}, fmt.Errorf("user ID is required")
	}
	if req.Username == "" {
		return "", time.Time{}, fmt.Errorf("username is required")
	}
	if req.SessionID == "" {
		return "", time.Time{}, fmt.Errorf("session ID is required")
	}
	
	// Validate role
	if !j.isRoleAllowed(req.Role) {
		return "", time.Time{}, fmt.Errorf("role '%s' is not allowed", req.Role)
	}
	
	expirationTime := time.Now().Add(j.tokenDuration)
	
	claims := &JWTClaims{
		UserID:     req.UserID,
		Username:   req.Username,
		Role:       string(req.Role),
		AuthMethod: string(req.AuthMethod),
		SessionID:  req.SessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    j.issuer,
			Subject:   fmt.Sprintf("%s:%d", req.Role, req.UserID),
		},
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secretKey))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}
	
	return tokenString, expirationTime, nil
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTManager) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.secretKey), nil
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}
	
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	
	// Check if token is expired
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, fmt.Errorf("token expired")
	}
	
	// Validate required claims
	if claims.UserID == 0 {
		return nil, fmt.Errorf("invalid user ID in token")
	}
	
	if claims.Username == "" {
		return nil, fmt.Errorf("invalid username in token")
	}
	
	if !j.isRoleAllowed(UserRole(claims.Role)) {
		return nil, fmt.Errorf("invalid role '%s' in token", claims.Role)
	}
	
	return claims, nil
}

// RefreshToken generates a new token with extended expiration
func (j *JWTManager) RefreshToken(tokenString string) (string, time.Time, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("invalid token for refresh: %w", err)
	}
	
	// Generate new token with same claims but new expiration
	return j.GenerateToken(TokenRequest{
		UserID:     claims.UserID,
		Username:   claims.Username,
		Role:       UserRole(claims.Role),
		AuthMethod: AuthMethod(claims.AuthMethod),
		SessionID:  claims.SessionID,
	})
}

// ExtractTokenFromHeader extracts JWT token from Authorization header
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is required")
	}
	
	// Check if header starts with "Bearer "
	const bearerPrefix = "Bearer "
	if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
		return "", fmt.Errorf("authorization header must start with 'Bearer '")
	}
	
	token := authHeader[len(bearerPrefix):]
	if token == "" {
		return "", fmt.Errorf("token is empty")
	}
	
	return token, nil
}

// IsTokenExpired checks if a token is expired without validating the signature
func IsTokenExpired(tokenString string) (bool, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &JWTClaims{})
	if err != nil {
		return false, fmt.Errorf("failed to parse token: %w", err)
	}
	
	claims, ok := token.Claims.(*JWTClaims)
	if !ok {
		return false, fmt.Errorf("invalid token claims")
	}
	
	if claims.ExpiresAt == nil {
		return false, fmt.Errorf("token has no expiration time")
	}
	
	return claims.ExpiresAt.Time.Before(time.Now()), nil
}

// isRoleAllowed checks if a role is in the allowed roles list
func (j *JWTManager) isRoleAllowed(role UserRole) bool {
	for _, allowedRole := range j.allowedRoles {
		if role == allowedRole {
			return true
		}
	}
	return false
}

// NewAdminTokenRequest creates a token request for admin users
func NewAdminTokenRequest(userID int, username, sessionID string) TokenRequest {
	return TokenRequest{
		UserID:     userID,
		Username:   username,
		Role:       RoleAdmin,
		AuthMethod: AuthPassword,
		SessionID:  sessionID,
	}
}

// NewUserTokenRequest creates a token request for regular users
func NewUserTokenRequest(userID int, username string, authMethod AuthMethod, sessionID string) TokenRequest {
	return TokenRequest{
		UserID:     userID,
		Username:   username,
		Role:       RoleUser,
		AuthMethod: authMethod,
		SessionID:  sessionID,
	}
}

// GenerateSecureSessionID generates a cryptographically secure session ID
func GenerateSecureSessionID() string {
	// Generate 32 random bytes
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to timestamp-based ID if crypto/rand fails
		return fmt.Sprintf("session_%d_%d", time.Now().UnixNano(), time.Now().Unix())
	}
	
	// Convert to hex string
	return "session_" + hex.EncodeToString(bytes)
}

