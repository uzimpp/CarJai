package services

import (
	"fmt"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
	"golang.org/x/crypto/bcrypt"
)

// UserService handles user-related business logic
type UserService struct {
	userRepo        *models.UserRepository
	userSessionRepo *models.UserSessionRepository
	jwtManager      *utils.JWTManager
}

// NewUserService creates a new user service
func NewUserService(userRepo *models.UserRepository, userSessionRepo *models.UserSessionRepository, jwtManager *utils.JWTManager) *UserService {
	return &UserService{
		userRepo:        userRepo,
		userSessionRepo: userSessionRepo,
		jwtManager:      jwtManager,
	}
}

// Signup creates a new user account
func (s *UserService) Signup(email, password, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", email)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
	}

	err = s.userRepo.CreateUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate session
	sessionID := utils.GenerateSecureSessionID()
	token, expiresAt, err := s.jwtManager.GenerateToken(utils.NewUserTokenRequest(
		user.ID, user.Email, utils.AuthPassword, sessionID,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session record
	session := &models.UserSession{
		UserID:    user.ID,
		Token:     token,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: expiresAt,
	}

	err = s.userSessionRepo.CreateUserSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &models.UserAuthResponse{
		Success: true,
		Data: models.UserAuthData{
			User:      user.ToPublic(),
			Token:     token,
			ExpiresAt: expiresAt,
		},
		Message: "User created successfully",
	}, nil
}

// Login authenticates a user
func (s *UserService) Login(email, password, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate session
	sessionID := utils.GenerateSecureSessionID()
	token, expiresAt, err := s.jwtManager.GenerateToken(utils.NewUserTokenRequest(
		user.ID, user.Email, utils.AuthPassword, sessionID,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Create session record
	session := &models.UserSession{
		UserID:    user.ID,
		Token:     token,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: expiresAt,
	}

	err = s.userSessionRepo.CreateUserSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &models.UserAuthResponse{
		Success: true,
		Data: models.UserAuthData{
			User:      user.ToPublic(),
			Token:     token,
			ExpiresAt: expiresAt,
		},
		Message: "Login successful",
	}, nil
}

// Logout invalidates a user session
func (s *UserService) Logout(token string) (*models.UserLogoutResponse, error) {
	// Delete session from database
	err := s.userSessionRepo.DeleteUserSession(token)
	if err != nil {
		return nil, fmt.Errorf("failed to logout: %w", err)
	}

	return &models.UserLogoutResponse{
		Success: true,
		Message: "Logout successful",
	}, nil
}

// GetCurrentUser returns the current user from JWT token
func (s *UserService) GetCurrentUser(token string) (*models.UserMeResponse, error) {
	// Validate token
	claims, err := s.jwtManager.ValidateToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Get user from database
	user, err := s.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return &models.UserMeResponse{
		Success: true,
		Data: models.UserMeData{
			User: user.ToPublic(),
		},
	}, nil
}

// ValidateUserSession validates a user session token
func (s *UserService) ValidateUserSession(token string) (*models.User, error) {
	// Validate JWT token
	claims, err := s.jwtManager.ValidateToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Check if session exists in database
	session, err := s.userSessionRepo.GetUserSessionByToken(token)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	// Check if session is expired
	if session.IsExpired() {
		// Clean up expired session
		s.userSessionRepo.DeleteUserSession(token)
		return nil, fmt.Errorf("session expired")
	}

	// Get user
	user, err := s.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

// RefreshToken generates a new token for the user
func (s *UserService) RefreshToken(token, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Validate current token
	claims, err := s.jwtManager.ValidateToken(token)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Get user
	user, err := s.userRepo.GetUserByID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Delete old session
	err = s.userSessionRepo.DeleteUserSession(token)
	if err != nil {
		return nil, fmt.Errorf("failed to delete old session: %w", err)
	}

	// Generate new session
	sessionID := utils.GenerateSecureSessionID()
	newToken, expiresAt, err := s.jwtManager.GenerateToken(utils.NewUserTokenRequest(
		user.ID, user.Email, utils.AuthPassword, sessionID,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to generate new token: %w", err)
	}

	// Create new session record
	session := &models.UserSession{
		UserID:    user.ID,
		Token:     newToken,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		ExpiresAt: expiresAt,
	}

	err = s.userSessionRepo.CreateUserSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to create new session: %w", err)
	}

	return &models.UserAuthResponse{
		Success: true,
		Data: models.UserAuthData{
			User:      user.ToPublic(),
			Token:     newToken,
			ExpiresAt: expiresAt,
		},
		Message: "Token refreshed successfully",
	}, nil
}
