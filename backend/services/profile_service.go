package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
)

// ProfileService handles profile-related business logic
type ProfileService struct {
	db *models.Database
}

// NewProfileService creates a new profile service
func NewProfileService(db *models.Database) *ProfileService {
	return &ProfileService{db: db}
}

// GetRolesForUser checks which roles a user has
func (s *ProfileService) GetRolesForUser(userID int) (models.UserRoles, error) {
	roles := models.UserRoles{
		Buyer:  false,
		Seller: false,
	}

	// Check if user is a buyer (gracefully handle missing tables)
	var buyerExists bool
	err := s.db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM buyers WHERE id = $1)", userID).Scan(&buyerExists)
	if err != nil {
		// If table doesn't exist, just return false (not an error)
		// This handles the case where migrations haven't been run yet
		roles.Buyer = false
	} else {
		roles.Buyer = buyerExists
	}

	// Check if user is a seller (gracefully handle missing tables)
	var sellerExists bool
	err = s.db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM sellers WHERE id = $1)", userID).Scan(&sellerExists)
	if err != nil {
		// If table doesn't exist, just return false (not an error)
		roles.Seller = false
	} else {
		roles.Seller = sellerExists
	}

	return roles, nil
}

// GetProfilesCompletenessForUser calculates completeness for user profiles
func (s *ProfileService) GetProfilesCompletenessForUser(userID int) (models.UserProfiles, error) {
	profiles := models.UserProfiles{
		BuyerComplete:  false,
		SellerComplete: false,
	}

	// Check buyer completeness (gracefully handle errors)
	buyer, err := s.GetBuyerByUserID(userID)
	if err == nil && buyer != nil {
		profiles.BuyerComplete = buyer.IsComplete()
	}
	// Ignore errors - just means buyer profile doesn't exist or table doesn't exist

	// Check seller completeness (gracefully handle errors)
	seller, err := s.GetSellerByUserID(userID)
	if err == nil && seller != nil {
		profiles.SellerComplete = seller.IsComplete()
	}
	// Ignore errors - just means seller profile doesn't exist or table doesn't exist

	return profiles, nil
}

// GetBuyerByUserID retrieves a buyer profile by user ID
func (s *ProfileService) GetBuyerByUserID(userID int) (*models.Buyer, error) {
	buyer := &models.Buyer{}
	query := `SELECT id, province, budget_min, budget_max FROM buyers WHERE id = $1`

	err := s.db.DB.QueryRow(query, userID).Scan(
		&buyer.ID, &buyer.Province, &buyer.BudgetMin, &buyer.BudgetMax,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("buyer profile not found")
		}
		return nil, fmt.Errorf("failed to get buyer profile: %w", err)
	}

	return buyer, nil
}

// GetSellerByUserID retrieves a seller profile by user ID
func (s *ProfileService) GetSellerByUserID(userID int) (*models.Seller, error) {
	seller := &models.Seller{}
	query := `SELECT id, display_name, about, map_link FROM sellers WHERE id = $1`

	err := s.db.DB.QueryRow(query, userID).Scan(
		&seller.ID, &seller.DisplayName, &seller.About, &seller.MapLink,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("seller profile not found")
		}
		return nil, fmt.Errorf("failed to get seller profile: %w", err)
	}

	return seller, nil
}

// GetSellerContacts retrieves all contacts for a seller
func (s *ProfileService) GetSellerContacts(sellerID int) ([]models.SellerContact, error) {
	query := `SELECT id, seller_id, contact_type, value, label FROM seller_contacts WHERE seller_id = $1 ORDER BY id`

	rows, err := s.db.DB.Query(query, sellerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get seller contacts: %w", err)
	}
	defer rows.Close()

	var contacts []models.SellerContact
	for rows.Next() {
		var contact models.SellerContact
		err := rows.Scan(&contact.ID, &contact.SellerID, &contact.ContactType, &contact.Value, &contact.Label)
		if err != nil {
			return nil, fmt.Errorf("failed to scan seller contact: %w", err)
		}
		contacts = append(contacts, contact)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating seller contacts: %w", err)
	}

	return contacts, nil
}

// UpsertBuyer creates or updates a buyer profile (idempotent)
func (s *ProfileService) UpsertBuyer(userID int, req models.BuyerRequest) (*models.Buyer, error) {
	// Validate budget constraints
	if req.BudgetMin != nil && *req.BudgetMin < 0 {
		return nil, fmt.Errorf("budget_min must be non-negative")
	}
	if req.BudgetMin != nil && req.BudgetMax != nil && *req.BudgetMin > *req.BudgetMax {
		return nil, fmt.Errorf("budget_min must be less than or equal to budget_max")
	}
	if req.Province != nil && len(*req.Province) > 100 {
		return nil, fmt.Errorf("province must be 100 characters or less")
	}

	query := `
		INSERT INTO buyers (id, province, budget_min, budget_max)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			province = EXCLUDED.province,
			budget_min = EXCLUDED.budget_min,
			budget_max = EXCLUDED.budget_max
		RETURNING id, province, budget_min, budget_max
	`

	buyer := &models.Buyer{}
	err := s.db.DB.QueryRow(query, userID, req.Province, req.BudgetMin, req.BudgetMax).Scan(
		&buyer.ID, &buyer.Province, &buyer.BudgetMin, &buyer.BudgetMax,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to upsert buyer profile: %w", err)
	}

	return buyer, nil
}

// UpsertSeller creates or updates a seller profile (idempotent)
func (s *ProfileService) UpsertSeller(userID int, req models.SellerRequest) (*models.Seller, *[]models.SellerContact, error) {
	// Validate display_name
	if strings.TrimSpace(req.DisplayName) == "" {
		return nil, nil, fmt.Errorf("display_name is required and cannot be blank")
	}
	if len(req.DisplayName) > 50 {
		return nil, nil, fmt.Errorf("display_name must be 50 characters or less")
	}
	if req.About != nil && len(*req.About) > 200 {
		return nil, nil, fmt.Errorf("about must be 200 characters or less")
	}

	// Start transaction
	tx, err := s.db.DB.Begin()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Upsert seller
	sellerQuery := `
		INSERT INTO sellers (id, display_name, about, map_link)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			about = EXCLUDED.about,
			map_link = EXCLUDED.map_link
		RETURNING id, display_name, about, map_link
	`

	seller := &models.Seller{}
	err = tx.QueryRow(sellerQuery, userID, req.DisplayName, req.About, req.MapLink).Scan(
		&seller.ID, &seller.DisplayName, &seller.About, &seller.MapLink,
	)

	if err != nil {
		return nil, nil, fmt.Errorf("failed to upsert seller profile: %w", err)
	}

	// Delete existing contacts
	_, err = tx.Exec("DELETE FROM seller_contacts WHERE seller_id = $1", userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to delete existing contacts: %w", err)
	}

	// Insert new contacts
	var contacts []models.SellerContact
	if len(req.Contacts) > 0 {
		contactQuery := `
			INSERT INTO seller_contacts (seller_id, contact_type, value, label)
			VALUES ($1, $2, $3, $4)
			RETURNING id, seller_id, contact_type, value, label
		`

		for _, c := range req.Contacts {
			var contact models.SellerContact
			err = tx.QueryRow(contactQuery, userID, c.ContactType, c.Value, c.Label).Scan(
				&contact.ID, &contact.SellerID, &contact.ContactType, &contact.Value, &contact.Label,
			)
			if err != nil {
				return nil, nil, fmt.Errorf("failed to insert contact: %w", err)
			}
			contacts = append(contacts, contact)
		}
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return seller, &contacts, nil
}

// GetFullProfile retrieves the complete profile for a user
func (s *ProfileService) GetFullProfile(userID int, user *models.User) (*models.ProfileData, error) {
	roles, err := s.GetRolesForUser(userID)
	if err != nil {
		return nil, err
	}

	profiles, err := s.GetProfilesCompletenessForUser(userID)
	if err != nil {
		return nil, err
	}

	data := &models.ProfileData{
		User:     user.ToPublic(),
		Roles:    roles,
		Profiles: profiles,
	}

	// Get buyer profile if exists
	if roles.Buyer {
		buyer, err := s.GetBuyerByUserID(userID)
		if err == nil {
			data.Buyer = buyer
		}
	}

	// Get seller profile if exists
	if roles.Seller {
		seller, err := s.GetSellerByUserID(userID)
		if err == nil {
			data.Seller = seller
			// Get seller contacts
			contacts, err := s.GetSellerContacts(userID)
			if err == nil {
				data.Contacts = contacts
			}
		}
	}

	return data, nil
}

// GetPublicSellerByID retrieves a public seller profile by ID or handle
func (s *ProfileService) GetPublicSellerByID(sellerIDOrHandle string) (*models.Seller, error) {
	seller := &models.Seller{}

	// Try as numeric ID first
	query := `SELECT id, display_name, about, map_link FROM sellers WHERE id = $1`
	err := s.db.DB.QueryRow(query, sellerIDOrHandle).Scan(
		&seller.ID, &seller.DisplayName, &seller.About, &seller.MapLink,
	)

	if err == nil {
		return seller, nil
	}

	// If not found, could add handle-based lookup in the future
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("seller not found")
	}

	return nil, fmt.Errorf("failed to get seller: %w", err)
}
