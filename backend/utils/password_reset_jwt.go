package utils

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// PasswordResetTokenClaims represents JWT claims for password reset
type PasswordResetTokenClaims struct {
	UserID  int    `json:"user_id"`
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
	jwt.RegisteredClaims
}

// GeneratePasswordResetToken generates a JWT token for password reset
func GeneratePasswordResetToken(userID int, email, secret string, expirationMinutes int) (string, error) {
	expiresAt := time.Now().Add(time.Duration(expirationMinutes) * time.Minute)

	claims := PasswordResetTokenClaims{
		UserID:  userID,
		Email:   email,
		Purpose: "password_reset",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "carjai-password-reset",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidatePasswordResetToken validates and parses a password reset JWT token
func ValidatePasswordResetToken(tokenString, secret string) (*PasswordResetTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &PasswordResetTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*PasswordResetTokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Verify purpose
	if claims.Purpose != "password_reset" {
		return nil, fmt.Errorf("invalid token purpose")
	}

	// Check expiration
	if claims.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("token has expired")
	}

	return claims, nil
}
