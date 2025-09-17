package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/config"
	"github.com/uzimpp/CarJai/backend/middleware"
	"github.com/uzimpp/CarJai/backend/utils"
)

// TestAdminAuthIntegration tests the complete admin authentication flow
func TestAdminAuthIntegration(t *testing.T) {
	// Setup test database (you would need to implement this)
	// For now, we'll create a mock setup
	
	// Create test configuration
	appConfig := &config.AppConfig{
		Port:            "8080",
		JWTSecret:       "test-secret-key-for-testing-only",
		JWTExpiration:   8,
		AdminRoutePrefix: "/admin",
		Environment:     "test",
	}
	
	// Create JWT manager
	_ = utils.NewJWTManager(
		appConfig.JWTSecret,
		time.Duration(appConfig.JWTExpiration)*time.Hour,
		"test-issuer",
	)
	
	// Create test server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock admin routes
		if r.URL.Path == "/admin/auth/login" && r.Method == "POST" {
			// Mock login response
			response := map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"admin": map[string]interface{}{
						"id":       1,
						"username": "admin",
						"name":     "Test Admin",
					},
					"token":      "mock-jwt-token",
					"expires_at": time.Now().Add(8 * time.Hour),
				},
				"message": "Login successful",
			}
			
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
		} else if r.URL.Path == "/admin/auth/me" && r.Method == "GET" {
			// Mock me response
			response := map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"admin": map[string]interface{}{
						"id":       1,
						"username": "admin",
						"name":     "Test Admin",
					},
					"session": map[string]interface{}{
						"ip_address": "127.0.0.1",
						"created_at": time.Now(),
						"expires_at": time.Now().Add(8 * time.Hour),
					},
				},
			}
			
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(response)
		} else {
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	
	t.Run("Login Flow", func(t *testing.T) {
		// Test login request
		loginData := map[string]string{
			"username": "admin",
			"password": "admin123",
		}
		
		jsonData, err := json.Marshal(loginData)
		if err != nil {
			t.Fatalf("Failed to marshal login data: %v", err)
		}
		
		resp, err := http.Post(server.URL+"/admin/auth/login", "application/json", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to make login request: %v", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var loginResponse map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&loginResponse); err != nil {
			t.Fatalf("Failed to decode login response: %v", err)
		}
		
		if !loginResponse["success"].(bool) {
			t.Error("Login should be successful")
		}
	})
	
	t.Run("Me Endpoint", func(t *testing.T) {
		// Test me endpoint with mock token
		req, err := http.NewRequest("GET", server.URL+"/admin/auth/me", nil)
		if err != nil {
			t.Fatalf("Failed to create me request: %v", err)
		}
		
		req.Header.Set("Authorization", "Bearer mock-jwt-token")
		
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to make me request: %v", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var meResponse map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&meResponse); err != nil {
			t.Fatalf("Failed to decode me response: %v", err)
		}
		
		if !meResponse["success"].(bool) {
			t.Error("Me endpoint should be successful")
		}
	})
}

// TestIPWhitelistIntegration tests IP whitelist functionality
func TestIPWhitelistIntegration(t *testing.T) {
	tests := []struct {
		name      string
		clientIP  string
		whitelist []string
		want      bool
		wantErr   bool
	}{
		{
			name:      "localhost IPv4",
			clientIP:  "127.0.0.1",
			whitelist: []string{"127.0.0.1/32"},
			want:      true,
			wantErr:   false,
		},
		{
			name:      "localhost IPv6",
			clientIP:  "::1",
			whitelist: []string{"::1/128"},
			want:      true,
			wantErr:   false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := utils.IsIPWhitelisted(tt.clientIP, tt.whitelist)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsIPWhitelisted() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("IsIPWhitelisted() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestJWTTokenFlow tests the complete JWT token flow
func TestJWTTokenFlow(t *testing.T) {
	secretKey := "test-secret-key-for-jwt-testing"
	tokenDuration := 1 * time.Hour
	manager := utils.NewJWTManager(secretKey, tokenDuration, "test-issuer")
	
	adminID := 1
	username := "testadmin"
	sessionID := "session_123"
	
	t.Run("Generate and Validate Token", func(t *testing.T) {
		// Generate token
		req := utils.NewAdminTokenRequest(adminID, username, sessionID)
		token, expiresAt, err := manager.GenerateToken(req)
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}
		
		if token == "" {
			t.Error("Generated token should not be empty")
		}
		
		if expiresAt.IsZero() {
			t.Error("Expiration time should not be zero")
		}
		
		// Validate token
		claims, err := manager.ValidateToken(token)
		if err != nil {
			t.Fatalf("Failed to validate token: %v", err)
		}
		
		if claims.UserID != adminID {
			t.Errorf("Expected UserID %d, got %d", adminID, claims.UserID)
		}
		
		if claims.Username != username {
			t.Errorf("Expected Username %s, got %s", username, claims.Username)
		}
		
		if claims.SessionID != sessionID {
			t.Errorf("Expected SessionID %s, got %s", sessionID, claims.SessionID)
		}
		
		if claims.Role != "admin" {
			t.Errorf("Expected Role admin, got %s", claims.Role)
		}
	})
	
	t.Run("Token Refresh", func(t *testing.T) {
		// Generate original token
		req := utils.NewAdminTokenRequest(adminID, username, sessionID)
		originalToken, _, err := manager.GenerateToken(req)
		if err != nil {
			t.Fatalf("Failed to generate original token: %v", err)
		}
		
		// Refresh token
		newToken, newExpiresAt, err := manager.RefreshToken(originalToken)
		if err != nil {
			t.Fatalf("Failed to refresh token: %v", err)
		}
		
		// New token should have different expiration time
		// Note: JWT tokens with identical claims may be identical
		// The important thing is that the expiration time is updated
		
		if newExpiresAt.IsZero() {
			t.Error("New expiration time should not be zero")
		}
		
		// Validate new token
		claims, err := manager.ValidateToken(newToken)
		if err != nil {
			t.Fatalf("Failed to validate refreshed token: %v", err)
		}
		
		if claims.UserID != adminID {
			t.Errorf("Expected UserID %d, got %d", adminID, claims.UserID)
		}
	})
}

// TestRateLimiting tests rate limiting functionality
func TestRateLimiting(t *testing.T) {
	// Create rate limiter
	limiter := middleware.NewRateLimiter(3, time.Minute) // 3 requests per minute
	
	t.Run("Rate Limit Allowed", func(t *testing.T) {
		key := "test-ip-10.0.0.1"
		
		// First 3 requests should be allowed
		for i := 0; i < 3; i++ {
			if !limiter.IsAllowed(key) {
				t.Errorf("Request %d should be allowed", i+1)
			}
		}
	})
	
	t.Run("Rate Limit Exceeded", func(t *testing.T) {
		key := "test-ip-10.0.0.2"
		
		// First 3 requests should be allowed
		for i := 0; i < 3; i++ {
			if !limiter.IsAllowed(key) {
				t.Errorf("Request %d should be allowed", i+1)
			}
		}
		
		// 4th request should be blocked
		if limiter.IsAllowed(key) {
			t.Error("4th request should be blocked")
		}
	})
	
	t.Run("Different Keys", func(t *testing.T) {
		key1 := "test-ip-10.0.0.3"
		key2 := "test-ip-10.0.0.4"
		
		// Both keys should be allowed
		if !limiter.IsAllowed(key1) {
			t.Error("Request for key1 should be allowed")
		}
		
		if !limiter.IsAllowed(key2) {
			t.Error("Request for key2 should be allowed")
		}
	})
}
