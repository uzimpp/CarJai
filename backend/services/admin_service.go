package services

import (
	"fmt"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminService handles admin authentication business logic
type AdminService struct {
	adminRepo       *models.AdminRepository
	sessionRepo     *models.SessionRepository
	ipWhitelistRepo *models.IPWhitelistRepository
	jwtManager      *utils.JWTManager
}

// NewAdminService creates a new admin service
func NewAdminService(
	adminRepo *models.AdminRepository,
	sessionRepo *models.SessionRepository,
	ipWhitelistRepo *models.IPWhitelistRepository,
	jwtManager *utils.JWTManager,
) *AdminService {
	return &AdminService{
		adminRepo:       adminRepo,
		sessionRepo:     sessionRepo,
		ipWhitelistRepo: ipWhitelistRepo,
		jwtManager:      jwtManager,
	}
}

// SigninRequest represents the sign in request
type SigninRequest struct {
	Username  string
	Password  string
	IPAddress string
	UserAgent string
}

// SigninResponse represents the sign in response
type SigninResponse struct {
	Admin     models.AdminPublic
	Token     string
	ExpiresAt time.Time
}

// Signin authenticates an admin user
func (s *AdminService) Signin(req SigninRequest) (*SigninResponse, error) {
	// Validate input
	if req.Username == "" || req.Password == "" {
		return nil, fmt.Errorf("username and password are required")
	}

	if req.IPAddress == "" {
		return nil, fmt.Errorf("IP address is required")
	}

	// Get admin by username
	admin, err := s.adminRepo.GetAdminByUsername(req.Username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	if !utils.VerifyPassword(req.Password, admin.PasswordHash) {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Check IP whitelist
	whitelistedIPs, err := s.ipWhitelistRepo.GetWhitelistedIPs(admin.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check IP whitelist: %w", err)
	}

	// Convert whitelist to string slice
	var ipList []string
	for _, entry := range whitelistedIPs {
		ipList = append(ipList, entry.IPAddress)
	}

	// Check if IP is whitelisted
	isWhitelisted, err := utils.IsIPWhitelisted(req.IPAddress, ipList)
	if err != nil {
		return nil, fmt.Errorf("failed to validate IP address: %w", err)
	}

	if !isWhitelisted {
		return nil, fmt.Errorf("IP address not authorized")
	}

	// Generate JWT token
	sessionID := utils.GenerateSecureSessionID()
	tokenReq := utils.NewAdminTokenRequest(admin.ID, admin.Username, sessionID)
	token, expiresAt, err := s.jwtManager.GenerateToken(tokenReq)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session
	session := &models.AdminSession{
		AdminID:   admin.ID,
		Token:     token,
		IPAddress: req.IPAddress,
		UserAgent: req.UserAgent,
		ExpiresAt: expiresAt,
	}

	err = s.sessionRepo.CreateSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Update last sign in time
	err = s.adminRepo.UpdateLastSignin(admin.ID)
	if err != nil {
		// Log error but don't fail the sign in
		fmt.Printf("Warning: failed to update last sign in time: %v\n", err)
	}

	return &SigninResponse{
		Admin:     admin.ToPublic(),
		Token:     token,
		ExpiresAt: expiresAt,
	}, nil
}

// SignoutRequest represents the sign out request
type SignoutRequest struct {
	Token string
}

// Signout signs out an admin user
func (s *AdminService) Signout(req SignoutRequest) error {
	if req.Token == "" {
		return fmt.Errorf("token is required")
	}

	// Delete session from database
	err := s.sessionRepo.DeleteSession(req.Token)
	if err != nil {
		return fmt.Errorf("failed to sign out: %w", err)
	}

	return nil
}

// GetCurrentAdmin retrieves the current admin session information
func (s *AdminService) GetCurrentAdmin(token string) (*models.AdminMeData, error) {
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	// Get session by token
	session, err := s.sessionRepo.GetSessionByToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid session")
	}

	// Check if session is expired
	if session.IsExpired() {
		// Clean up expired session
		s.sessionRepo.DeleteSession(token)
		return nil, fmt.Errorf("session expired")
	}

	// Get admin information
	admin, err := s.adminRepo.GetAdminByID(session.AdminID)
	if err != nil {
		return nil, fmt.Errorf("admin not found")
	}

	return &models.AdminMeData{
		Admin:   admin.ToPublic(),
		Session: session.ToPublic(),
	}, nil
}

// ValidateSession validates a session token
func (s *AdminService) ValidateSession(token string) (*models.AdminSession, error) {
	if token == "" {
		return nil, fmt.Errorf("token is required")
	}

	// Get session by token
	session, err := s.sessionRepo.GetSessionByToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid session")
	}

	// Check if session is expired
	if session.IsExpired() {
		// Clean up expired session
		s.sessionRepo.DeleteSession(token)
		return nil, fmt.Errorf("session expired")
	}

	return session, nil
}

// CleanupExpiredSessions removes all expired sessions
func (s *AdminService) CleanupExpiredSessions() (int64, error) {
	return s.sessionRepo.CleanupExpiredSessions()
}

// AddIPToWhitelist adds an IP address to the whitelist for an admin
func (s *AdminService) AddIPToWhitelist(adminID int, ipAddress, description string) error {
	// Validate IP address
	err := utils.ValidateIPAddress(ipAddress)
	if err != nil {
		return fmt.Errorf("invalid IP address: %w", err)
	}

	// Check if admin exists
	_, err = s.adminRepo.GetAdminByID(adminID)
	if err != nil {
		return fmt.Errorf("admin not found")
	}

	// Add IP to whitelist
	err = s.ipWhitelistRepo.AddIPToWhitelist(adminID, ipAddress, description)
	if err != nil {
		return fmt.Errorf("failed to add IP to whitelist: %w", err)
	}

	return nil
}

// RemoveIPFromWhitelist removes an IP address from the whitelist
func (s *AdminService) RemoveIPFromWhitelist(adminID int, ipAddress string) error {
	err := s.ipWhitelistRepo.RemoveIPFromWhitelist(adminID, ipAddress)
	if err != nil {
		return fmt.Errorf("failed to remove IP from whitelist: %w", err)
	}

	return nil
}

// GetWhitelistedIPs retrieves all whitelisted IP addresses for an admin
func (s *AdminService) GetWhitelistedIPs(adminID int) ([]models.AdminIPWhitelist, error) {
	return s.ipWhitelistRepo.GetWhitelistedIPs(adminID)
}

// GetAdminByID retrieves an admin by ID
func (s *AdminService) GetAdminByID(adminID int) (*models.Admin, error) {
	return s.adminRepo.GetAdminByID(adminID)
}

// GetManagedAdmins retrieves all admins for management
func (s *AdminService) GetManagedAdmins() ([]models.AdminPublic, error) {
	admins, err := s.adminRepo.GetAdmins()
	if err != nil {
		return nil, err
	}

	publicAdmins := make([]models.AdminPublic, len(admins))
	for i, admin := range admins {
		publicAdmins[i] = admin.ToPublic()
	}

	return publicAdmins, nil
}