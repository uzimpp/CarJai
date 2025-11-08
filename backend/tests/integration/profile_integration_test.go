package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
)

// TestProfileFlow tests profile-related endpoints
func TestProfileFlow(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Create test user
	timestamp := time.Now().Unix() % 1000000 // Limit to 6 digits to keep username under 20 chars
	testEmail := fmt.Sprintf("user%d@example.com", timestamp)
	signupData := models.UserSignupRequest{
		Email:    testEmail,
		Password: "password123",
		Username: fmt.Sprintf("user%d", timestamp), // "user" (4) + 6 digits = 10 chars
		Name:     "Test User",
	}

	jsonData, _ := json.Marshal(signupData)
	resp, _ := http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))
	cookies := resp.Cookies()
	var userToken string
	for _, cookie := range cookies {
		if cookie.Name == "jwt" {
			userToken = cookie.Value
			break
		}
	}
	resp.Body.Close()

	if userToken == "" {
		t.Fatal("Failed to get user token")
	}

	// Test Get Profile
	t.Run("GetProfile", func(t *testing.T) {
		req, _ := http.NewRequest("GET", ts.server.URL+"/api/profile/", nil)
		req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to get profile: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	// Test Update Profile
	t.Run("UpdateProfile", func(t *testing.T) {
		updateData := models.UserUpdateSelfRequest{
			Name: stringPtr("Updated Name"),
		}

		jsonData, _ := json.Marshal(updateData)
		req, _ := http.NewRequest("PATCH", ts.server.URL+"/api/profile/", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to update profile: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	// Test Upsert Buyer Profile
	t.Run("UpsertBuyerProfile", func(t *testing.T) {
		buyerData := models.BuyerRequest{}

		jsonData, _ := json.Marshal(buyerData)
		req, _ := http.NewRequest("PUT", ts.server.URL+"/api/profile/buyer", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to upsert buyer profile: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	// Test Upsert Seller Profile
	t.Run("UpsertSellerProfile", func(t *testing.T) {
		sellerData := models.SellerRequest{
			DisplayName: "Test Business",
		}

		jsonData, _ := json.Marshal(sellerData)
		req, _ := http.NewRequest("PUT", ts.server.URL+"/api/profile/seller", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("Failed to upsert seller profile: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})
}

func stringPtr(s string) *string {
	return &s
}

