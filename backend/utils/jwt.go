package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents the JWT claims structure
type JWTClaims struct {
	AdminID   int    `json:"admin_id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

// JWTManager handles JWT token operations
type JWTManager struct {
	secretKey     string
	tokenDuration time.Duration
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(secretKey string, tokenDuration time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:     secretKey,
		tokenDuration: tokenDuration,
	}
}

// GenerateToken generates a new JWT token for admin
func (j *JWTManager) GenerateToken(adminID int, username, sessionID string) (string, time.Time, error) {
	expirationTime := time.Now().Add(j.tokenDuration)
	
	claims := &JWTClaims{
		AdminID:   adminID,
		Username:  username,
		Role:      "admin",
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "carjai-admin",
			Subject:   fmt.Sprintf("admin:%d", adminID),
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
	if claims.AdminID == 0 {
		return nil, fmt.Errorf("invalid admin ID in token")
	}
	
	if claims.Username == "" {
		return nil, fmt.Errorf("invalid username in token")
	}
	
	if claims.Role != "admin" {
		return nil, fmt.Errorf("invalid role in token")
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
	return j.GenerateToken(claims.AdminID, claims.Username, claims.SessionID)
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
