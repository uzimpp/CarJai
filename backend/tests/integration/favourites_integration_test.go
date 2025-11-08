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

// TestFavouritesFlow tests the complete favourites flow
func TestFavouritesFlow(t *testing.T) {
	ts := setupTestServer(t)
	defer ts.cleanup()

	// Create test user (buyer)
	testEmail := fmt.Sprintf("buyer%d@example.com", time.Now().UnixNano())
	signupData := models.UserSignupRequest{
		Email:    testEmail,
		Password: "password123",
		Username: fmt.Sprintf("buyer%d", time.Now().UnixNano()),
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

	// Create a car first (need a seller)
	sellerEmail := fmt.Sprintf("seller%d@example.com", time.Now().UnixNano())
	sellerSignup := models.UserSignupRequest{
		Email:    sellerEmail,
		Password: "password123",
		Username: fmt.Sprintf("seller%d", time.Now().UnixNano()),
		Name:     "Test Seller",
	}

	jsonData, _ = json.Marshal(sellerSignup)
	resp, _ = http.Post(ts.server.URL+"/api/auth/signup", "application/json", bytes.NewBuffer(jsonData))
	sellerCookies := resp.Cookies()
	var sellerToken string
	for _, cookie := range sellerCookies {
		if cookie.Name == "jwt" {
			sellerToken = cookie.Value
			break
		}
	}
	resp.Body.Close()

	seller, _ := ts.services.User.ValidateUserSession(sellerToken)
	if seller != nil {
		ts.services.Profile.UpsertSeller(seller.ID, models.SellerRequest{
			BusinessName: "Test Business",
		})

		// Create a car
		car, err := ts.services.Car.CreateCar(seller.ID)
		if err != nil {
			t.Fatalf("Failed to create car: %v", err)
		}

		// Test Add Favourite
		t.Run("AddFavourite", func(t *testing.T) {
			req, _ := http.NewRequest("POST", fmt.Sprintf("%s/api/favorites/%d", ts.server.URL, car.ID), nil)
			req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Failed to add favourite: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected status 200, got %d", resp.StatusCode)
			}
		})

		// Test Get My Favourites
		t.Run("GetMyFavourites", func(t *testing.T) {
			req, _ := http.NewRequest("GET", ts.server.URL+"/api/favorites/my", nil)
			req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Failed to get favourites: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected status 200, got %d", resp.StatusCode)
			}
		})

		// Test Remove Favourite
		t.Run("RemoveFavourite", func(t *testing.T) {
			req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/api/favorites/%d", ts.server.URL, car.ID), nil)
			req.AddCookie(&http.Cookie{Name: "jwt", Value: userToken})

			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("Failed to remove favourite: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected status 200, got %d", resp.StatusCode)
			}
		})
	}
}

