package utils

import (
	"testing"
	"time"
)

func TestJWTManager_GenerateToken(t *testing.T) {
	secretKey := "test-secret-key"
	tokenDuration := 1 * time.Hour
	manager := NewJWTManager(secretKey, tokenDuration)
	
	tests := []struct {
		name      string
		adminID   int
		username  string
		sessionID string
		wantErr   bool
	}{
		{
			name:      "valid token generation",
			adminID:   1,
			username:  "admin",
			sessionID: "session_123",
			wantErr:   false,
		},
		{
			name:      "empty username",
			adminID:   1,
			username:  "",
			sessionID: "session_123",
			wantErr:   false, // Should still generate token
		},
		{
			name:      "zero admin ID",
			adminID:   0,
			username:  "admin",
			sessionID: "session_123",
			wantErr:   false, // Should still generate token
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, expiresAt, err := manager.GenerateToken(tt.adminID, tt.username, tt.sessionID)
			if (err != nil) != tt.wantErr {
				t.Errorf("JWTManager.GenerateToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			
			if !tt.wantErr {
				if token == "" {
					t.Error("JWTManager.GenerateToken() returned empty token")
				}
				
				if expiresAt.IsZero() {
					t.Error("JWTManager.GenerateToken() returned zero expiration time")
				}
				
				// Check if expiration is approximately correct
				expectedExpiry := time.Now().Add(tokenDuration)
				if expiresAt.Before(expectedExpiry.Add(-time.Minute)) || expiresAt.After(expectedExpiry.Add(time.Minute)) {
					t.Errorf("JWTManager.GenerateToken() expiration time is not correct, got %v", expiresAt)
				}
			}
		})
	}
}

func TestJWTManager_ValidateToken(t *testing.T) {
	secretKey := "test-secret-key"
	tokenDuration := 1 * time.Hour
	manager := NewJWTManager(secretKey, tokenDuration)
	
	// Generate a valid token
	adminID := 1
	username := "admin"
	sessionID := "session_123"
	token, _, err := manager.GenerateToken(adminID, username, sessionID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	tests := []struct {
		name    string
		token   string
		wantErr bool
	}{
		{
			name:    "valid token",
			token:   token,
			wantErr: false,
		},
		{
			name:    "invalid token",
			token:   "invalid.token.here",
			wantErr: true,
		},
		{
			name:    "empty token",
			token:   "",
			wantErr: true,
		},
		{
			name:    "malformed token",
			token:   "not-a-jwt-token",
			wantErr: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := manager.ValidateToken(tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("JWTManager.ValidateToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			
			if !tt.wantErr {
				if claims.AdminID != adminID {
					t.Errorf("JWTManager.ValidateToken() AdminID = %v, want %v", claims.AdminID, adminID)
				}
				if claims.Username != username {
					t.Errorf("JWTManager.ValidateToken() Username = %v, want %v", claims.Username, username)
				}
				if claims.SessionID != sessionID {
					t.Errorf("JWTManager.ValidateToken() SessionID = %v, want %v", claims.SessionID, sessionID)
				}
				if claims.Role != "admin" {
					t.Errorf("JWTManager.ValidateToken() Role = %v, want admin", claims.Role)
				}
			}
		})
	}
}

func TestJWTManager_RefreshToken(t *testing.T) {
	secretKey := "test-secret-key"
	tokenDuration := 1 * time.Hour
	manager := NewJWTManager(secretKey, tokenDuration)
	
	// Generate a valid token
	adminID := 1
	username := "admin"
	sessionID := "session_123"
	originalToken, _, err := manager.GenerateToken(adminID, username, sessionID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	tests := []struct {
		name    string
		token   string
		wantErr bool
	}{
		{
			name:    "valid token refresh",
			token:   originalToken,
			wantErr: false,
		},
		{
			name:    "invalid token refresh",
			token:   "invalid.token.here",
			wantErr: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			newToken, expiresAt, err := manager.RefreshToken(tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("JWTManager.RefreshToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			
			if !tt.wantErr {
				if newToken == "" {
					t.Error("JWTManager.RefreshToken() returned empty token")
				}
				
				if expiresAt.IsZero() {
					t.Error("JWTManager.RefreshToken() returned zero expiration time")
				}
				
				// New token should be different from original
				if newToken == originalToken {
					t.Error("JWTManager.RefreshToken() returned same token")
				}
			}
		})
	}
}

func TestExtractTokenFromHeader(t *testing.T) {
	tests := []struct {
		name      string
		authHeader string
		want      string
		wantErr   bool
	}{
		{
			name:      "valid bearer token",
			authHeader: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			want:      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			wantErr:   false,
		},
		{
			name:      "empty header",
			authHeader: "",
			want:      "",
			wantErr:   true,
		},
		{
			name:      "no bearer prefix",
			authHeader: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			want:      "",
			wantErr:   true,
		},
		{
			name:      "empty token after bearer",
			authHeader: "Bearer ",
			want:      "",
			wantErr:   true,
		},
		{
			name:      "lowercase bearer",
			authHeader: "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
			want:      "",
			wantErr:   true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ExtractTokenFromHeader(tt.authHeader)
			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractTokenFromHeader() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ExtractTokenFromHeader() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsTokenExpired(t *testing.T) {
	secretKey := "test-secret-key"
	tokenDuration := 1 * time.Hour
	manager := NewJWTManager(secretKey, tokenDuration)
	
	// Generate a valid token
	token, _, err := manager.GenerateToken(1, "admin", "session_123")
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}
	
	tests := []struct {
		name    string
		token   string
		want    bool
		wantErr bool
	}{
		{
			name:    "valid non-expired token",
			token:   token,
			want:    false,
			wantErr: false,
		},
		{
			name:    "invalid token",
			token:   "invalid.token.here",
			want:    false,
			wantErr: true,
		},
		{
			name:    "malformed token",
			token:   "not-a-jwt-token",
			want:    false,
			wantErr: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := IsTokenExpired(tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsTokenExpired() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("IsTokenExpired() = %v, want %v", got, tt.want)
			}
		})
	}
}
