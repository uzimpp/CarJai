package models

import (
	"database/sql"
	"fmt"
	"time"
)

// Database represents the database connection and operations
type Database struct {
	DB *sql.DB
}

// NewDatabase creates a new database instance
func NewDatabase(db *sql.DB) *Database {
	return &Database{DB: db}
}

// AdminRepository handles admin-related database operations
type AdminRepository struct {
	db *Database
}

// NewAdminRepository creates a new admin repository
func NewAdminRepository(db *Database) *AdminRepository {
	return &AdminRepository{db: db}
}

// CreateAdmin creates a new admin user
func (r *AdminRepository) CreateAdmin(admin *Admin) error {
	query := `
		INSERT INTO admins (username, password_hash, name)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`
	
	err := r.db.DB.QueryRow(query, admin.Username, admin.PasswordHash, admin.Name).Scan(
		&admin.ID, &admin.CreatedAt,
	)
	
	if err != nil {
		return fmt.Errorf("failed to create admin: %w", err)
	}
	
	return nil
}

// GetAdminByUsername retrieves an admin by username
func (r *AdminRepository) GetAdminByUsername(username string) (*Admin, error) {
	admin := &Admin{}
	query := `
		SELECT id, username, password_hash, name, last_login_at, created_at
		FROM admins
		WHERE username = $1`
	
	err := r.db.DB.QueryRow(query, username).Scan(
		&admin.ID, &admin.Username, &admin.PasswordHash, &admin.Name,
		&admin.LastLoginAt, &admin.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("admin not found")
		}
		return nil, fmt.Errorf("failed to get admin by username: %w", err)
	}
	
	return admin, nil
}

// GetAdminByID retrieves an admin by ID
func (r *AdminRepository) GetAdminByID(id int) (*Admin, error) {
	admin := &Admin{}
	query := `
		SELECT id, username, password_hash, name, last_login_at, created_at
		FROM admins
		WHERE id = $1`
	
	err := r.db.DB.QueryRow(query, id).Scan(
		&admin.ID, &admin.Username, &admin.PasswordHash, &admin.Name,
		&admin.LastLoginAt, &admin.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("admin not found")
		}
		return nil, fmt.Errorf("failed to get admin by ID: %w", err)
	}
	
	return admin, nil
}

// UpdateLastLogin updates the last login timestamp for an admin
func (r *AdminRepository) UpdateLastLogin(adminID int) error {
	query := `UPDATE admins SET last_login_at = NOW() WHERE id = $1`
	
	result, err := r.db.DB.Exec(query, adminID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("admin not found")
	}
	
	return nil
}

// ValidateAdminCredentials validates admin username and password
func (r *AdminRepository) ValidateAdminCredentials(username, password string) (*Admin, error) {
	admin, err := r.GetAdminByUsername(username)
	if err != nil {
		return nil, err
	}
	
	// Password validation will be handled by bcrypt in the service layer
	return admin, nil
}

// SessionRepository handles session-related database operations
type SessionRepository struct {
	db *Database
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *Database) *SessionRepository {
	return &SessionRepository{db: db}
}

// CreateSession creates a new admin session
func (r *SessionRepository) CreateSession(session *AdminSession) error {
	query := `
		INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`
	
	err := r.db.DB.QueryRow(query, session.AdminID, session.Token, session.IPAddress, 
		session.UserAgent, session.ExpiresAt).Scan(&session.ID, &session.CreatedAt)
	
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	
	return nil
}

// GetSessionByToken retrieves a session by token
func (r *SessionRepository) GetSessionByToken(token string) (*AdminSession, error) {
	session := &AdminSession{}
	query := `
		SELECT id, admin_id, token, ip_address, user_agent, expires_at, created_at
		FROM admin_sessions
		WHERE token = $1`
	
	err := r.db.DB.QueryRow(query, token).Scan(
		&session.ID, &session.AdminID, &session.Token, &session.IPAddress,
		&session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to get session by token: %w", err)
	}
	
	return session, nil
}

// DeleteSession deletes a session by token
func (r *SessionRepository) DeleteSession(token string) error {
	query := `DELETE FROM admin_sessions WHERE token = $1`
	
	result, err := r.db.DB.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("session not found")
	}
	
	return nil
}

// CleanupExpiredSessions removes all expired sessions
func (r *SessionRepository) CleanupExpiredSessions() (int64, error) {
	query := `DELETE FROM admin_sessions WHERE expires_at < NOW()`
	
	result, err := r.db.DB.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	return rowsAffected, nil
}

// GetSessionsByAdminID retrieves all sessions for an admin
func (r *SessionRepository) GetSessionsByAdminID(adminID int) ([]AdminSession, error) {
	query := `
		SELECT id, admin_id, token, ip_address, user_agent, expires_at, created_at
		FROM admin_sessions
		WHERE admin_id = $1
		ORDER BY created_at DESC`
	
	rows, err := r.db.DB.Query(query, adminID)
	if err != nil {
		return nil, fmt.Errorf("failed to get sessions by admin ID: %w", err)
	}
	defer rows.Close()
	
	var sessions []AdminSession
	for rows.Next() {
		var session AdminSession
		err := rows.Scan(
			&session.ID, &session.AdminID, &session.Token, &session.IPAddress,
			&session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		sessions = append(sessions, session)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating sessions: %w", err)
	}
	
	return sessions, nil
}

// IPWhitelistRepository handles IP whitelist-related database operations
type IPWhitelistRepository struct {
	db *Database
}

// NewIPWhitelistRepository creates a new IP whitelist repository
func NewIPWhitelistRepository(db *Database) *IPWhitelistRepository {
	return &IPWhitelistRepository{db: db}
}

// AddIPToWhitelist adds an IP address to the whitelist for an admin
func (r *IPWhitelistRepository) AddIPToWhitelist(adminID int, ipAddress, description string) error {
	query := `
		INSERT INTO admin_ip_whitelist (admin_id, ip_address, description)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`
	
	var id int
	var createdAt time.Time
	err := r.db.DB.QueryRow(query, adminID, ipAddress, description).Scan(&id, &createdAt)
	
	if err != nil {
		return fmt.Errorf("failed to add IP to whitelist: %w", err)
	}
	
	return nil
}

// RemoveIPFromWhitelist removes an IP address from the whitelist
func (r *IPWhitelistRepository) RemoveIPFromWhitelist(adminID int, ipAddress string) error {
	query := `DELETE FROM admin_ip_whitelist WHERE admin_id = $1 AND ip_address = $2`
	
	result, err := r.db.DB.Exec(query, adminID, ipAddress)
	if err != nil {
		return fmt.Errorf("failed to remove IP from whitelist: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("IP address not found in whitelist")
	}
	
	return nil
}

// GetWhitelistedIPs retrieves all whitelisted IP addresses for an admin
func (r *IPWhitelistRepository) GetWhitelistedIPs(adminID int) ([]AdminIPWhitelist, error) {
	query := `
		SELECT id, admin_id, ip_address, description, created_at
		FROM admin_ip_whitelist
		WHERE admin_id = $1
		ORDER BY created_at DESC`
	
	rows, err := r.db.DB.Query(query, adminID)
	if err != nil {
		return nil, fmt.Errorf("failed to get whitelisted IPs: %w", err)
	}
	defer rows.Close()
	
	var whitelist []AdminIPWhitelist
	for rows.Next() {
		var entry AdminIPWhitelist
		err := rows.Scan(
			&entry.ID, &entry.AdminID, &entry.IPAddress, &entry.Description, &entry.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan whitelist entry: %w", err)
		}
		whitelist = append(whitelist, entry)
	}
	
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating whitelist entries: %w", err)
	}
	
	return whitelist, nil
}

// IsIPWhitelisted checks if an IP address is whitelisted for an admin
func (r *IPWhitelistRepository) IsIPWhitelisted(adminID int, ipAddress string) (bool, error) {
	query := `
		SELECT COUNT(*) 
		FROM admin_ip_whitelist 
		WHERE admin_id = $1 AND ip_address = $2`
	
	var count int
	err := r.db.DB.QueryRow(query, adminID, ipAddress).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check IP whitelist: %w", err)
	}
	
	return count > 0, nil
}
