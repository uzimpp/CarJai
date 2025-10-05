package services

import (
	"fmt"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
	"golang.org/x/crypto/bcrypt"
)

// UserService handles user-related business logic
type UserService struct {
	userRepo        *models.UserRepository
	userSessionRepo *models.UserSessionRepository
	jwtManager      *utils.JWTManager
	profileService  *ProfileService
}

// NewUserService creates a new user service
func NewUserService(userRepo *models.UserRepository, userSessionRepo *models.UserSessionRepository, jwtManager *utils.JWTManager) *UserService {
	return &UserService{
		userRepo:        userRepo,
		userSessionRepo: userSessionRepo,
		jwtManager:      jwtManager,
		profileService:  nil, // Will be set later to avoid circular dependency
	}
}

// SetProfileService sets the profile service (to avoid circular dependency)
func (s *UserService) SetProfileService(profileService *ProfileService) {
	s.profileService = profileService
}

// Signup creates a new user account
func (s *UserService) Signup(email, password, username, name, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Check if user already exists by email
	existingUser, err := s.userRepo.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", email)
	}

	// Check if username already exists
	existingUserByUsername, err := s.userRepo.GetUserByUsername(username)
	if err == nil && existingUserByUsername != nil {
		return nil, fmt.Errorf("username %s is already taken", username)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:        email,
		Username:     username,
		Name:         name,
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

// Signin authenticates a user
func (s *UserService) Signin(emailOrUsername, password, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Try to get user by email first, then by username
	var user *models.User
	var err error

	// Check if input looks like an email (contains @)
	if strings.Contains(emailOrUsername, "@") {
		user, err = s.userRepo.GetUserByEmail(emailOrUsername)
	} else {
		user, err = s.userRepo.GetUserByUsername(emailOrUsername)
	}

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
		Message: "Sign in successful",
	}, nil
}

// Signout invalidates a user session
func (s *UserService) Signout(token string) (*models.UserSignoutResponse, error) {
	// Delete session from database
	err := s.userSessionRepo.DeleteUserSession(token)
	if err != nil {
		return nil, fmt.Errorf("failed to sign out: %w", err)
	}

	return &models.UserSignoutResponse{
		Success: true,
		Message: "Sign out successful",
	}, nil
}

// GetCurrentUser returns the current user from JWT token with roles and completeness
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

	// Get roles and completeness if profile service is set
	roles := models.UserRoles{Buyer: false, Seller: false}
	profiles := models.UserProfiles{BuyerComplete: false, SellerComplete: false}

	if s.profileService != nil {
		roles, _ = s.profileService.GetRolesForUser(user.ID)
		profiles, _ = s.profileService.GetProfilesCompletenessForUser(user.ID)
	}

	return &models.UserMeResponse{
		Success: true,
		Data: models.UserMeData{
			User:     user.ToPublic(),
			Roles:    roles,
			Profiles: profiles,
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

// IsSeller checks if a user is a seller
func (s *UserService) IsSeller(userID int) (bool, error) {
	if s.profileService == nil {
		return false, fmt.Errorf("profile service not initialized")
	}
	
	roles, err := s.profileService.GetRolesForUser(userID)
	if err != nil {
		return false, err
	}
	
	return roles.Seller, nil
}
