package models

import (
	"database/sql"
	"fmt"
	"strings"
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
		&admin.LastSigninAt, &admin.CreatedAt,
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
		&admin.LastSigninAt, &admin.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("admin not found")
		}
		return nil, fmt.Errorf("failed to get admin by ID: %w", err)
	}

	return admin, nil
}

// UpdateLastSignin updates the last sign in timestamp for an admin
func (r *AdminRepository) UpdateLastSignin(adminID int) error {
	query := `UPDATE admins SET last_login_at = NOW() WHERE id = $1`

	result, err := r.db.DB.Exec(query, adminID)
	if err != nil {
		return fmt.Errorf("failed to update last sign in: %w", err)
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

// UserRepository handles user-related database operations
type UserRepository struct {
	db *Database
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *Database) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(user *User) error {
	query := `
		INSERT INTO users (email, username, name, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at`

	err := r.db.DB.QueryRow(query, user.Email, user.Username, user.Name, user.PasswordHash).Scan(
		&user.ID, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, username, name, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1`

	err := r.db.DB.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.Username, &user.Name, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return user, nil
}

// GetUserByUsername retrieves a user by username
func (r *UserRepository) GetUserByUsername(username string) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, username, name, password_hash, created_at, updated_at
		FROM users
		WHERE username = $1`

	err := r.db.DB.QueryRow(query, username).Scan(
		&user.ID, &user.Email, &user.Username, &user.Name, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(id int) (*User, error) {
	user := &User{}
	query := `
		SELECT id, email, username, name, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1`

	err := r.db.DB.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.Username, &user.Name, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return user, nil
}

// ValidateUserCredentials validates user email and password
func (r *UserRepository) ValidateUserCredentials(email, password string) (*User, error) {
	user, err := r.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	// Password validation will be handled by bcrypt in the service layer
	return user, nil
}

// UpdateUser updates user fields (username, name)
func (r *UserRepository) UpdateUser(userID int, username, name *string) (*User, error) {
	// Build dynamic query based on which fields are provided
	query := "UPDATE users SET "
	args := []interface{}{}
	argNum := 1
	updates := []string{}

	if username != nil {
		updates = append(updates, fmt.Sprintf("username = $%d", argNum))
		args = append(args, *username)
		argNum++
	}

	if name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argNum))
		args = append(args, *name)
		argNum++
	}

	if len(updates) == 0 {
		// No fields to update
		return r.GetUserByID(userID)
	}

	query += strings.Join(updates, ", ")
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id, email, username, name, password_hash, created_at, updated_at", argNum)
	args = append(args, userID)

	user := &User{}
	err := r.db.DB.QueryRow(query, args...).Scan(
		&user.ID, &user.Email, &user.Username, &user.Name, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

// UpdatePassword updates a user's password
func (r *UserRepository) UpdatePassword(userID int, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`

	result, err := r.db.DB.Exec(query, passwordHash, userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UserSessionRepository handles user session-related database operations
type UserSessionRepository struct {
	db *Database
}

// NewUserSessionRepository creates a new user session repository
func NewUserSessionRepository(db *Database) *UserSessionRepository {
	return &UserSessionRepository{db: db}
}

// CreateUserSession creates a new user session
func (r *UserSessionRepository) CreateUserSession(session *UserSession) error {
	query := `
		INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`

	err := r.db.DB.QueryRow(query, session.UserID, session.Token, session.IPAddress,
		session.UserAgent, session.ExpiresAt).Scan(&session.ID, &session.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user session: %w", err)
	}

	return nil
}

// GetUserSessionByToken retrieves a user session by token
func (r *UserSessionRepository) GetUserSessionByToken(token string) (*UserSession, error) {
	session := &UserSession{}
	query := `
		SELECT id, user_id, token, ip_address, user_agent, expires_at, created_at
		FROM user_sessions
		WHERE token = $1`

	err := r.db.DB.QueryRow(query, token).Scan(
		&session.ID, &session.UserID, &session.Token, &session.IPAddress,
		&session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user session not found")
		}
		return nil, fmt.Errorf("failed to get user session by token: %w", err)
	}

	return session, nil
}

// DeleteUserSession deletes a user session by token
func (r *UserSessionRepository) DeleteUserSession(token string) error {
	query := `DELETE FROM user_sessions WHERE token = $1`

	result, err := r.db.DB.Exec(query, token)
	if err != nil {
		return fmt.Errorf("failed to delete user session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user session not found")
	}

	return nil
}

// CleanupExpiredUserSessions removes all expired user sessions
func (r *UserSessionRepository) CleanupExpiredUserSessions() (int64, error) {
	query := `DELETE FROM user_sessions WHERE expires_at < NOW()`

	result, err := r.db.DB.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired user sessions: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get rows affected: %w", err)
	}

	return rowsAffected, nil
}

// GetUserSessionsByUserID retrieves all sessions for a user
func (r *UserSessionRepository) GetUserSessionsByUserID(userID int) ([]UserSession, error) {
	query := `
		SELECT id, user_id, token, ip_address, user_agent, expires_at, created_at
		FROM user_sessions
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions by user ID: %w", err)
	}
	defer rows.Close()

	var sessions []UserSession
	for rows.Next() {
		var session UserSession
		err := rows.Scan(
			&session.ID, &session.UserID, &session.Token, &session.IPAddress,
			&session.UserAgent, &session.ExpiresAt, &session.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user session: %w", err)
		}
		sessions = append(sessions, session)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user sessions: %w", err)
	}

	return sessions, nil
}
