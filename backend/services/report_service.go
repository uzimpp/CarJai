package services

import (
    "database/sql"
    "encoding/json"
    "errors"
    "fmt"
    "strconv"
    "strings"
    "time"

    "github.com/uzimpp/CarJai/backend/models"
)

var carTopics = map[string]struct{}{
    "false_information": {},
    "fraud": {},
    "illegal_item": {},
    "safety_issue": {},
    "other": {},
    "cond_mismatch": {},
    "fake_details": {},
    "car_not_exist": {},
    "already_sold": {},
    "edited_photo": {},
}

var sellerTopics = map[string]struct{}{
    "harassment": {},
    "fraud": {},
    "scam": {},
    "other": {},
    "contact_unreachable": {},
    "no_show": {},
    "selling_fake_car": {},
    "impersonation": {},
}

type ReportService struct {
    repo           *models.ReportRepository
    carService     *CarService
    profileService *ProfileService
    db             *sql.DB
}

func NewReportService(repo *models.ReportRepository, carService *CarService, profileService *ProfileService, database *models.Database) *ReportService {
    return &ReportService{repo: repo, carService: carService, profileService: profileService, db: database.DB}
}

// ErrConflict is a sentinel error used to indicate a conflict (HTTP 409)
// Handlers can use IsConflict to check and map it to 409.
var ErrConflict = errors.New("conflict")

// SubmitCarReport validates and creates a car report
func (s *ReportService) SubmitCarReport(reporterID, carID int, topic string, subTopics []string, description string) (int, error) {
    topic = strings.TrimSpace(strings.ToLower(topic))
    description = strings.TrimSpace(description)

    if _, ok := carTopics[topic]; !ok {
        return 0, fmt.Errorf("invalid topic")
    }

    // Verify car exists
    if _, err := s.carService.GetCarByID(carID); err != nil {
        return 0, err
    }

    // Prevent duplicate report within 3 days
    dup, err := s.repo.HasRecentDuplicateByTopic(reporterID, "car", carID, topic, 3)
    if err != nil {
        return 0, err
    }
    if dup {
        return 0, fmt.Errorf("%w: duplicate report within 3 days", ErrConflict)
    }

    subJSON, _ := json.Marshal(subTopics)
    return s.repo.CreateCarReport(reporterID, carID, topic, json.RawMessage(subJSON), description)
}

// SubmitSellerReport validates and creates a seller report
func (s *ReportService) SubmitSellerReport(reporterID, sellerID int, topic string, subTopics []string, description string) (int, error) {
    topic = strings.TrimSpace(strings.ToLower(topic))
    description = strings.Trim(description, " \n\t")

    if _, ok := sellerTopics[topic]; !ok {
        return 0, fmt.Errorf("invalid topic")
    }

    // Prevent self-report (seller reporting themselves)
    if reporterID == sellerID {
        return 0, fmt.Errorf("cannot report yourself")
    }

    // Verify seller exists
    if _, err := s.profileService.GetPublicSellerByID(strconv.Itoa(sellerID)); err != nil {
        return 0, err
    }

    // Prevent duplicate report within 3 days
    dup, err := s.repo.HasRecentDuplicateByTopic(reporterID, "seller", sellerID, topic, 3)
    if err != nil {
        return 0, err
    }
    if dup {
        return 0, fmt.Errorf("%w: duplicate report within 3 days", ErrConflict)
    }

    subJSON, _ := json.Marshal(subTopics)
    return s.repo.CreateSellerReport(reporterID, sellerID, topic, json.RawMessage(subJSON), description)
}

// ListReports returns filtered reports with pagination
func (s *ReportService) ListReports(filters models.ReportFilters) ([]models.Report, int, error) {
    return s.repo.ListReports(filters)
}

func (s *ReportService) GetReportByID(id int) (*models.Report, error) {
    return s.repo.GetReportByID(id)
}

// UpdateReportStatus updates status and admin notes transactionally
func (s *ReportService) UpdateReportStatus(id int, status string, adminNotes *string, adminID int) error {
    status = strings.ToLower(strings.TrimSpace(status))
    allowed := map[string]struct{}{ "pending": {}, "reviewed": {}, "resolved": {}, "dismissed": {} }
    if _, ok := allowed[status]; !ok {
        return fmt.Errorf("invalid status")
    }
    tx, err := s.db.Begin()
    if err != nil {
        return err
    }
    defer func() {
        if err != nil {
            _ = tx.Rollback()
        }
    }()
    if err = s.repo.UpdateReportStatusTx(tx, id, status, adminNotes, adminID); err != nil {
        return err
    }
    if err = tx.Commit(); err != nil {
        return err
    }
    return nil
}

// Admin user actions (audit logged)
func (s *ReportService) BanUser(userID, adminID int, notes *string) (int, error) {
    tx, err := s.db.Begin()
    if err != nil {
        return 0, err
    }
    defer func() {
        if err != nil {
            _ = tx.Rollback()
        }
    }()
    
    // Update user status to 'banned'
    result, err := tx.Exec("UPDATE users SET status = 'banned' WHERE id = $1", userID)
    if err != nil {
        return 0, fmt.Errorf("failed to update user status: %w", err)
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return 0, fmt.Errorf("failed to get rows affected: %w", err)
    }
    if rowsAffected == 0 {
        return 0, fmt.Errorf("user not found")
    }
    
    // Invalidate all user sessions
    _, err = tx.Exec("DELETE FROM user_sessions WHERE user_id = $1", userID)
    if err != nil {
        return 0, fmt.Errorf("failed to invalidate user sessions: %w", err)
    }
    
    // Log the admin action
    id, err := s.repo.LogSellerAdminActionTx(tx, userID, adminID, "ban", notes, nil)
    if err != nil {
        return 0, err
    }
    
    if err = tx.Commit(); err != nil {
        return 0, err
    }
    return id, nil
}

func (s *ReportService) SuspendUser(userID, adminID int, until time.Time, notes *string) (int, error) {
    tx, err := s.db.Begin()
    if err != nil {
        return 0, err
    }
    defer func() {
        if err != nil {
            _ = tx.Rollback()
        }
    }()
    
    // Update user status to 'suspended'
    result, err := tx.Exec("UPDATE users SET status = 'suspended' WHERE id = $1", userID)
    if err != nil {
        return 0, fmt.Errorf("failed to update user status: %w", err)
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return 0, fmt.Errorf("failed to get rows affected: %w", err)
    }
    if rowsAffected == 0 {
        return 0, fmt.Errorf("user not found")
    }
    
    // Invalidate all user sessions
    _, err = tx.Exec("DELETE FROM user_sessions WHERE user_id = $1", userID)
    if err != nil {
        return 0, fmt.Errorf("failed to invalidate user sessions: %w", err)
    }
    
    id, err := s.repo.LogSellerAdminActionTx(tx, userID, adminID, "suspend", notes, &until)
    if err != nil {
        return 0, err
    }
    if err = tx.Commit(); err != nil {
        return 0, err
    }
    return id, nil
}

func (s *ReportService) WarnUser(userID, adminID int, notes *string) (int, error) {
    tx, err := s.db.Begin()
    if err != nil {
        return 0, err
    }
    defer func() {
        if err != nil {
            _ = tx.Rollback()
        }
    }()
    id, err := s.repo.LogSellerAdminActionTx(tx, userID, adminID, "warn", notes, nil)
    if err != nil {
        return 0, err
    }
    if err = tx.Commit(); err != nil {
        return 0, err
    }
    return id, nil
}

// UnbanUser restores a banned user to active status
func (s *ReportService) UnbanUser(userID, adminID int, notes *string) (int, error) {
    tx, err := s.db.Begin()
    if err != nil {
        return 0, err
    }
    defer func() {
        if err != nil {
            _ = tx.Rollback()
        }
    }()
    
    // Check if user exists
    var userExists bool
    err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", userID).Scan(&userExists)
    if err != nil {
        return 0, fmt.Errorf("failed to check user existence: %w", err)
    }
    if !userExists {
        return 0, fmt.Errorf("user not found")
    }
    
    // Update user status to 'active'
    result, err := tx.Exec("UPDATE users SET status = 'active' WHERE id = $1", userID)
    if err != nil {
        return 0, fmt.Errorf("failed to update user status: %w", err)
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return 0, fmt.Errorf("failed to get rows affected: %w", err)
    }
    if rowsAffected == 0 {
        return 0, fmt.Errorf("user not found")
    }
    
    // Log the admin action
    id, err := s.repo.LogSellerAdminActionTx(tx, userID, adminID, "unban", notes, nil)
    if err != nil {
        return 0, err
    }
    
    if err = tx.Commit(); err != nil {
        return 0, err
    }
    return id, nil
}

// ConflictError helper is expected by handlers to map to 409
func (s *ReportService) IsConflict(err error) bool {
    return errors.Is(err, ErrConflict)
}

// GetPendingReportCount retrieves the count of all pending reports
func (s *ReportService) GetPendingReportCount() (int, error) {
	count, err := s.repo.CountPendingReports() 
	if err != nil {
		return 0, fmt.Errorf("failed to get pending report count: %w", err)
	}
	return count, nil
}