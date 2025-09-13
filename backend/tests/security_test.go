package tests

import (
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/utils"
)

// TestPasswordSecurity tests password security features
func TestPasswordSecurity(t *testing.T) {
	t.Run("Password Hashing", func(t *testing.T) {
		password := "testpassword123"
		
		// Hash password
		hash, err := utils.HashPassword(password)
		if err != nil {
			t.Fatalf("Failed to hash password: %v", err)
		}
		
		// Hash should be different from original password
		if hash == password {
			t.Error("Hashed password should be different from original")
		}
		
		// Hash should not be empty
		if hash == "" {
			t.Error("Hashed password should not be empty")
		}
		
		// Hash should be longer than original password
		if len(hash) <= len(password) {
			t.Error("Hashed password should be longer than original")
		}
	})
	
	t.Run("Password Verification", func(t *testing.T) {
		password := "testpassword123"
		wrongPassword := "wrongpassword"
		
		// Hash password
		hash, err := utils.HashPassword(password)
		if err != nil {
			t.Fatalf("Failed to hash password: %v", err)
		}
		
		// Correct password should verify
		if !utils.VerifyPassword(password, hash) {
			t.Error("Correct password should verify")
		}
		
		// Wrong password should not verify
		if utils.VerifyPassword(wrongPassword, hash) {
			t.Error("Wrong password should not verify")
		}
		
		// Empty password should not verify
		if utils.VerifyPassword("", hash) {
			t.Error("Empty password should not verify")
		}
	})
	
	t.Run("Password Strength Validation", func(t *testing.T) {
		tests := []struct {
			password string
			wantErr  bool
		}{
			{"validpassword123", false},
			{"12345", true}, // Too short
			{"", true},      // Empty
			{"verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789", true}, // Too long
		}
		
		for _, tt := range tests {
			err := utils.ValidatePasswordStrength(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePasswordStrength(%s) error = %v, wantErr %v", tt.password, err, tt.wantErr)
			}
		}
	})
}

// TestJWTSecurity tests JWT security features
func TestJWTSecurity(t *testing.T) {
	secretKey := "test-secret-key-for-security-testing"
	tokenDuration := 1 * time.Hour
	manager := utils.NewJWTManager(secretKey, tokenDuration)
	
	t.Run("Token Generation Security", func(t *testing.T) {
		adminID := 1
		username := "admin"
		sessionID := "session_123"
		
		// Generate token
		token, expiresAt, err := manager.GenerateToken(adminID, username, sessionID)
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}
		
		// Token should not contain sensitive information in plain text
		if contains(token, "admin") {
			t.Error("Token should not contain username in plain text")
		}
		
		if contains(token, "session_123") {
			t.Error("Token should not contain session ID in plain text")
		}
		
		// Expiration should be in the future
		if expiresAt.Before(time.Now()) {
			t.Error("Token expiration should be in the future")
		}
	})
	
	t.Run("Token Validation Security", func(t *testing.T) {
		// Test with invalid tokens
		invalidTokens := []string{
			"",
			"invalid.token.here",
			"not-a-jwt-token",
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature",
		}
		
		for _, token := range invalidTokens {
			_, err := manager.ValidateToken(token)
			if err == nil {
				t.Errorf("Invalid token should be rejected: %s", token)
			}
		}
	})
	
	t.Run("Token Tampering", func(t *testing.T) {
		// Generate valid token
		token, _, err := manager.GenerateToken(1, "admin", "session_123")
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}
		
		// Tamper with token (change last character)
		tamperedToken := token[:len(token)-1] + "X"
		
		// Tampered token should be rejected
		_, err = manager.ValidateToken(tamperedToken)
		if err == nil {
			t.Error("Tampered token should be rejected")
		}
	})
	
	t.Run("Different Secret Keys", func(t *testing.T) {
		// Create two managers with different secret keys
		manager1 := utils.NewJWTManager("secret1", tokenDuration)
		manager2 := utils.NewJWTManager("secret2", tokenDuration)
		
		// Generate token with first manager
		token, _, err := manager1.GenerateToken(1, "admin", "session_123")
		if err != nil {
			t.Fatalf("Failed to generate token: %v", err)
		}
		
		// Token should not validate with second manager
		_, err = manager2.ValidateToken(token)
		if err == nil {
			t.Error("Token should not validate with different secret key")
		}
	})
}

// TestIPSecurity tests IP security features
func TestIPSecurity(t *testing.T) {
	t.Run("IP Address Validation", func(t *testing.T) {
		validIPs := []string{,
			"127.0.0.1",
			"::1",
			"2001:db8::1",
			"2001:db8::/32",
		}
		
		invalidIPs := []string{
			"",
			"999.999.999.999",
			"not-an-ip",
		}
		
		for _, ip := range validIPs {
			if err := utils.ValidateIPAddress(ip); err != nil {
				t.Errorf("Valid IP should pass validation: %s, error: %v", ip, err)
			}
		}
		
		for _, ip := range invalidIPs {
			if err := utils.ValidateIPAddress(ip); err == nil {
				t.Errorf("Invalid IP should fail validation: %s", ip)
			}
		}
	})
	
	t.Run("IP Whitelist Security", func(t *testing.T) {
		whitelist := []string{
			"127.0.0.1/32",
			"::1/128",
		}
		
		// Test allowed IPs
		allowedIPs := []string{
			"10.0.0.100",
			"10.0.0.1",
			"127.0.0.1",
			"::1",
		}
		
		// Test blocked IPs
		blockedIPs := []string{
			"10.0.0.1",
			"8.8.8.8",
		}
		
		for _, ip := range allowedIPs {
			allowed, err := utils.IsIPWhitelisted(ip, whitelist)
			if err != nil {
				t.Errorf("Error checking allowed IP %s: %v", ip, err)
			}
			if !allowed {
				t.Errorf("IP %s should be allowed", ip)
			}
		}
		
		for _, ip := range blockedIPs {
			allowed, err := utils.IsIPWhitelisted(ip, whitelist)
			if err != nil {
				t.Errorf("Error checking blocked IP %s: %v", ip, err)
			}
			if allowed {
				t.Errorf("IP %s should be blocked", ip)
			}
		}
	})
	
	t.Run("IP Spoofing Protection", func(t *testing.T) {
		// Test IP extraction from headers
		tests := []struct {
			name           string
			remoteAddr     string
			xForwardedFor  string
			xRealIP        string
			expectedIP     string
		}{
			{
				name:       "X-Real-IP takes priority",
				remoteAddr: "10.0.0.100:8080",
				xForwardedFor: "10.0.0.1, 10.0.0.50",
				xRealIP:    "203.0.113.1",
				expectedIP: "203.0.113.1",
			},
			{
				name:       "X-Forwarded-For first IP",
				remoteAddr: "10.0.0.100:8080",
				xForwardedFor: "203.0.113.1, 10.0.0.50",
				xRealIP:    "",
				expectedIP: "203.0.113.1",
			},
			{
				name:       "RemoteAddr fallback",
				remoteAddr: "10.0.0.100:8080",
				xForwardedFor: "",
				xRealIP:    "",
				expectedIP: "10.0.0.100",
			},
		}
		
		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				ip := utils.ExtractClientIP(tt.remoteAddr, tt.xForwardedFor, tt.xRealIP)
				if ip != tt.expectedIP {
					t.Errorf("Expected IP %s, got %s", tt.expectedIP, ip)
				}
			})
		}
	})
}

// TestRateLimitSecurity tests rate limiting security
func TestRateLimitSecurity(t *testing.T) {
	t.Run("Rate Limit Enforcement", func(t *testing.T) {
		// Create rate limiter with very low limit for testing
		limiter := utils.NewRateLimiter(2, time.Minute)
		key := "test-ip-10.0.0.1"
		
		// First 2 requests should be allowed
		if !limiter.IsAllowed(key) {
			t.Error("First request should be allowed")
		}
		
		if !limiter.IsAllowed(key) {
			t.Error("Second request should be allowed")
		}
		
		// Third request should be blocked
		if limiter.IsAllowed(key) {
			t.Error("Third request should be blocked")
		}
	})
	
	t.Run("Rate Limit Isolation", func(t *testing.T) {
		limiter := utils.NewRateLimiter(1, time.Minute)
		key1 := "test-ip-10.0.0.1"
		key2 := "test-ip-10.0.0.2"
		
		// Both keys should be allowed initially
		if !limiter.IsAllowed(key1) {
			t.Error("First key should be allowed")
		}
		
		if !limiter.IsAllowed(key2) {
			t.Error("Second key should be allowed")
		}
		
		// Second request for key1 should be blocked
		if limiter.IsAllowed(key1) {
			t.Error("Second request for key1 should be blocked")
		}
		
		// But key2 should still be allowed
		if !limiter.IsAllowed(key2) {
			t.Error("Second request for key2 should be allowed")
		}
	})
}

// Helper function to check if string contains substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr || 
		   len(s) > len(substr) && contains(s[1:], substr)
}
