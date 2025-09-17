package utils

import (
	"context"
	"fmt"

	"google.golang.org/api/idtoken"
)

// VerifyGoogleIDToken validates a Google ID token against the expected audience (client ID)
// and returns the email and subject if valid.
func VerifyGoogleIDToken(ctx context.Context, idToken, audience string) (string, string, error) {
	if idToken == "" {
		return "", "", fmt.Errorf("id token is required")
	}
	if audience == "" {
		return "", "", fmt.Errorf("google client id (audience) is required")
	}
	payload, err := idtoken.Validate(ctx, idToken, audience)
	if err != nil {
		return "", "", fmt.Errorf("invalid Google ID token: %w", err)
	}

	// Extract standard fields
	emailValue, ok := payload.Claims["email"].(string)
	if !ok || emailValue == "" {
		return "", "", fmt.Errorf("email not present in Google token")
	}
	subValue, ok := payload.Claims["sub"].(string)
	if !ok || subValue == "" {
		return "", "", fmt.Errorf("subject not present in Google token")
	}

	return emailValue, subValue, nil
}
