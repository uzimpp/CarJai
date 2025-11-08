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

// TestRecentViewsFlow tests recent views endpoints
func TestRecentViewsFlow(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Create test user (buyer)
	timestamp := time.Now().Unix() % 1000000 // Limit to 6 digits to keep username under 20 chars
	testEmail := fmt.Sprintf("buyer%d@example.com", timestamp)
	signupData := models.UserSignupRequest{
		Email:    testEmail,
		Password: "password123",
		Username: fmt.Sprintf("buyer%d", timestamp), // "buyer" (5) + 6 digits = 11 chars
		Name:     "Test Buyer",
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

	// Create buyer profile
	user, _ := ts.services.User.ValidateUserSession(userToken)
	if user != nil {
		ts.services.Profile.UpsertBuyer(user.ID, models.BuyerRequest{})
	}

	// Create a car
	sellerEmail := fmt.Sprintf("seller%d@example.com", time.Now().UnixNano())
	sellerSignup := models.UserSignupRequest{
		Email:    sellerEmail,
		Password: "password123",
		Username: fmt.Sprintf("seller%d", time.Now().UnixNano()),
		Name:     "Test Seller",
	}

	jsonData, _ = json.Marshal(sellerSignup)
	resp, _ = http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))
	resp.Body.Close()

	seller, _ := ts.services.User.ValidateUserSession(userToken)
	if seller != nil {
		ts.services.Profile.UpsertSeller(seller.ID, models.SellerRequest{
			DisplayName: "Test Business",
		})

		car, err := ts.services.Car.CreateCar(seller.ID)
		if err != nil {
			t.Fatalf("Failed to create car: %v", err)
		}

		// Test Record View
		t.Run("RecordView", func(t *testing.T) {
			viewData := models.RecentViewRequest{
				CarID: car.ID,
			}

			jsonData, _ := json.Marshal(viewData)
			req, _ := http.NewRequest("POST", ts.server.URL+"/api/recent-views", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")
			req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Failed to record view: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected status 200, got %d", resp.StatusCode)
			}
		})

		// Test Get Recent Views
		t.Run("GetRecentViews", func(t *testing.T) {
			req, _ := http.NewRequest("GET", ts.server.URL+"/api/recent-views?limit=10", nil)
			req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Failed to get recent views: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected status 200, got %d", resp.StatusCode)
			}
		})
	}
}

