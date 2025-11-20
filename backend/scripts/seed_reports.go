package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"
)

const (
	NUM_REPORTS_TO_CREATE = 50
)

var (
	// Report topics for cars
	CAR_REPORT_TOPICS = []string{
		"Misleading Information",
		"Price Discrepancy",
		"Condition Issues",
		"Missing Documents",
		"Fraudulent Listing",
		"Duplicate Listing",
		"Spam",
	}

	// Report topics for sellers
	SELLER_REPORT_TOPICS = []string{
		"Unprofessional Behavior",
		"Scam Attempt",
		"Harassment",
		"Fake Account",
		"Spam Messages",
		"Refusal to Provide Information",
	}

	// Report statuses
	REPORT_STATUSES = []string{"pending", "reviewed", "resolved", "dismissed"}
)

// seedReportsData seeds reports (car and seller reports)
func seedReportsData(db *sql.DB) error {
	// Get existing users (reporters)
	reporters, err := getUsers(db)
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}
	if len(reporters) == 0 {
		return fmt.Errorf("no users found - seed users first")
	}
	log.Printf("✓ Found %d potential reporters", len(reporters))

	// Get existing cars
	cars, err := getCars(db)
	if err != nil {
		return fmt.Errorf("failed to get cars: %w", err)
	}
	if len(cars) == 0 {
		return fmt.Errorf("no cars found - seed cars first")
	}
	log.Printf("✓ Found %d cars", len(cars))

	// Get existing sellers
	sellers, err := getSellers(db)
	if err != nil {
		return fmt.Errorf("failed to get sellers: %w", err)
	}
	if len(sellers) == 0 {
		return fmt.Errorf("no sellers found - seed users first")
	}
	log.Printf("✓ Found %d sellers", len(sellers))

	log.Printf("Creating %d reports...", NUM_REPORTS_TO_CREATE)

	carReportsCreated := 0
	sellerReportsCreated := 0

	for i := 0; i < NUM_REPORTS_TO_CREATE; i++ {
		reporterID := randomItem(reporters)

		// 70% car reports, 30% seller reports
		isCarReport := rand.Float32() < 0.7

		var reportID int
		var err error

		if isCarReport {
			carID := randomItem(cars)
			reportID, err = createCarReport(db, reporterID, carID)
			if err != nil {
				log.Printf("✗ Failed to create car report: %v", err)
				continue
			}
			carReportsCreated++
		} else {
			sellerID := randomItem(sellers)
			reportID, err = createSellerReport(db, reporterID, sellerID)
			if err != nil {
				log.Printf("✗ Failed to create seller report: %v", err)
				continue
			}
			sellerReportsCreated++
		}

		log.Printf("  ✓ Created report %d (type: %s)", reportID, map[bool]string{true: "car", false: "seller"}[isCarReport])
	}

	log.Printf("Total Reports: %d (Car: %d, Seller: %d)", carReportsCreated+sellerReportsCreated, carReportsCreated, sellerReportsCreated)
	return nil
}

// getUsers gets all user IDs
func getUsers(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id FROM users ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		users = append(users, id)
	}
	return users, nil
}

// getCars gets all car IDs
func getCars(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id FROM cars WHERE status = 'active' ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cars []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		cars = append(cars, id)
	}
	return cars, nil
}

// getSellers gets all seller IDs
func getSellers(db *sql.DB) ([]int, error) {
	rows, err := db.Query(`SELECT id FROM sellers ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sellers []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		sellers = append(sellers, id)
	}
	return sellers, nil
}

// createCarReport creates a car report
func createCarReport(db *sql.DB, reporterID, carID int) (int, error) {
	topic := randomItem(CAR_REPORT_TOPICS)
	subTopics := generateSubTopics()
	description := generateCarReportDescription(topic)
	status := randomItem(REPORT_STATUSES)

	// Random created_at within last 30 days
	createdAt := randomTimeInRange(30)

	var reportID int
	var reviewedAt *time.Time
	var reviewedByAdminID *int

	// If status is not pending, add review info
	if status != "pending" {
		reviewedAtVal := createdAt.Add(time.Hour * time.Duration(randomInt(1, 24*7))) // Reviewed within a week
		reviewedAt = &reviewedAtVal
		// Get a random admin ID (or leave null if no admins)
		var adminID int
		err := db.QueryRow(`SELECT id FROM admins ORDER BY id LIMIT 1`).Scan(&adminID)
		if err == nil {
			reviewedByAdminID = &adminID
		}
	}

	err := db.QueryRow(`
		INSERT INTO reports (
			report_type, car_id, reporter_id, topic, sub_topics, description,
			status, created_at, reviewed_at, reviewed_by_admin_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, "car", carID, reporterID, topic, subTopics, description,
		status, createdAt, reviewedAt, reviewedByAdminID).Scan(&reportID)

	return reportID, err
}

// createSellerReport creates a seller report
func createSellerReport(db *sql.DB, reporterID, sellerID int) (int, error) {
	topic := randomItem(SELLER_REPORT_TOPICS)
	subTopics := generateSubTopics()
	description := generateSellerReportDescription(topic)
	status := randomItem(REPORT_STATUSES)

	// Random created_at within last 30 days
	createdAt := randomTimeInRange(30)

	var reportID int
	var reviewedAt *time.Time
	var reviewedByAdminID *int

	// If status is not pending, add review info
	if status != "pending" {
		reviewedAtVal := createdAt.Add(time.Hour * time.Duration(randomInt(1, 24*7))) // Reviewed within a week
		reviewedAt = &reviewedAtVal
		// Get a random admin ID (or leave null if no admins)
		var adminID int
		err := db.QueryRow(`SELECT id FROM admins ORDER BY id LIMIT 1`).Scan(&adminID)
		if err == nil {
			reviewedByAdminID = &adminID
		}
	}

	err := db.QueryRow(`
		INSERT INTO reports (
			report_type, seller_id, reporter_id, topic, sub_topics, description,
			status, created_at, reviewed_at, reviewed_by_admin_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, "seller", sellerID, reporterID, topic, subTopics, description,
		status, createdAt, reviewedAt, reviewedByAdminID).Scan(&reportID)

	return reportID, err
}

// generateSubTopics generates random sub-topics as JSON
func generateSubTopics() json.RawMessage {
	subTopics := []string{
		"urgent",
		"needs_review",
		"follow_up_required",
	}
	// Randomly select 0-2 sub-topics
	count := randomInt(0, 2)
	selected := randomItems(subTopics, count)
	jsonData, _ := json.Marshal(selected)
	return json.RawMessage(jsonData)
}

// generateCarReportDescription generates a description for a car report
func generateCarReportDescription(topic string) string {
	descriptions := map[string][]string{
		"Misleading Information": {
			"The car description does not match the actual condition.",
			"Photos are misleading - car looks different in person.",
			"Year or mileage information is incorrect.",
		},
		"Price Discrepancy": {
			"The listed price is different from what was discussed.",
			"Hidden fees not mentioned in the listing.",
		},
		"Condition Issues": {
			"The car has undisclosed damage.",
			"Mechanical issues not mentioned in the listing.",
		},
		"Missing Documents": {
			"Seller refuses to provide necessary documents.",
			"Documents appear to be fake or altered.",
		},
		"Fraudulent Listing": {
			"This appears to be a scam listing.",
			"Seller is asking for payment before inspection.",
		},
		"Duplicate Listing": {
			"This car is listed multiple times.",
			"Same car with different prices.",
		},
		"Spam": {
			"This listing appears to be spam.",
			"Repeated posting of the same content.",
		},
	}

	if descs, ok := descriptions[topic]; ok && len(descs) > 0 {
		return randomItem(descs)
	}
	return fmt.Sprintf("Report regarding: %s", topic)
}

// generateSellerReportDescription generates a description for a seller report
func generateSellerReportDescription(topic string) string {
	descriptions := map[string][]string{
		"Unprofessional Behavior": {
			"Seller was rude and unprofessional during communication.",
			"Seller did not respond to inquiries in a timely manner.",
		},
		"Scam Attempt": {
			"Seller attempted to scam me.",
			"Seller asked for payment through suspicious channels.",
		},
		"Harassment": {
			"Seller sent inappropriate messages.",
			"Seller continued to contact me after I declined.",
		},
		"Fake Account": {
			"This appears to be a fake account.",
			"Seller information seems fabricated.",
		},
		"Spam Messages": {
			"Seller sent spam messages.",
			"Repeated unsolicited contact.",
		},
		"Refusal to Provide Information": {
			"Seller refused to provide basic information about the car.",
			"Seller is being evasive about car details.",
		},
	}

	if descs, ok := descriptions[topic]; ok && len(descs) > 0 {
		return randomItem(descs)
	}
	return fmt.Sprintf("Report regarding: %s", topic)
}
