package services

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
	"golang.org/x/crypto/bcrypt"

	// "google.golang.org/api/oauth2/v2"
	// "google.golang.org/api/option"
	"google.golang.org/api/idtoken"
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

type GoogleUserInfo struct {
	Email     string
	Sub       string // corresponds to "Id" in oauth2.Userinfo
	Name      string // full name
	GivenName string // first/given name
}

// GoogleAuth handles Google OAuth authentication
func (s *UserService) GoogleAuth(
	credential, mode, ipAddress, userAgent, clientID string,
) (*models.UserAuthResponse, error) {

	// Verify Google ID token
	gUser, err := s.verifyGoogleToken(credential, clientID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify Google token: %w", err)
	}

	// Check if this Google account is already linked
	authProvider, err := s.userRepo.GetAuthProvider("google", gUser.Sub)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check auth provider: %w", err)
	}

	if authProvider != nil {
		// Existing Google login → fetch user and issue JWT
		user, err := s.userRepo.GetUserByID(authProvider.UserID)
		if err != nil {
			return nil, fmt.Errorf("user not found for existing auth provider")
		}
		return s.createAuthResponse(user, ipAddress, userAgent, utils.AuthGoogle)
	}

	// New Google user
	if mode == "signin" {
		// User tried to signin but account doesn’t exist
		return nil, fmt.Errorf("user with email %s not found", gUser.Email)
	}

	// Generate username safely
	username := generateUsername(gUser.GivenName, gUser.Sub, func(u string) bool {
		existing, _ := s.userRepo.GetUserByUsername(u)
		return existing != nil
	})

	// Create new user
	newUser := &models.User{
		Email:    gUser.Email,
		Username: username,
		Name:     gUser.Name,
	}

	if err := s.userRepo.CreateUser(newUser); err != nil {
		return nil, fmt.Errorf("failed to create new user: %w", err)
	}

	// Create AuthProvider entry
	authProviderEntry := &models.AuthProvider{
		UserID:         newUser.ID,
		Provider:       "google",
		ProviderUserID: gUser.Sub,
		Email:          gUser.Email,
	}

	if err := s.userRepo.CreateAuthProvider(authProviderEntry); err != nil {
		return nil, fmt.Errorf("failed to create auth provider: %w", err)
	}

	// Issue JWT and return auth response
	return s.createAuthResponse(newUser, ipAddress, userAgent, utils.AuthGoogle)
}

// verifyGoogleToken verifies the Google ID token and returns user info
func (s *UserService) verifyGoogleToken(idToken, clientID string) (*GoogleUserInfo, error) {
	ctx := context.Background()

	payload, err := idtoken.Validate(ctx, idToken, clientID)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}

	email, _ := payload.Claims["email"].(string)
	sub, _ := payload.Claims["sub"].(string)
	givenName, _ := payload.Claims["given_name"].(string)
	fullName, _ := payload.Claims["name"].(string)

	return &GoogleUserInfo{
		Email:     email,
		Sub:       sub,
		GivenName: givenName,
		Name:      fullName,
	}, nil
}

// Helper: Generate unique username from given name + sub
var usernameCleaner = regexp.MustCompile(`[^a-z0-9]+`) // only lowercase letters & digits

func generateUsername(givenName, sub string, exists func(username string) bool) string {
	cleaned := strings.ToLower(strings.TrimSpace(givenName))
	cleaned = usernameCleaner.ReplaceAllString(cleaned, "")
	if cleaned == "" {
		cleaned = "user"
	}

	username := cleaned
	if !exists(username) {
		return username
	}

	// Append last 8 chars of sub
	suffix := sub
	if len(sub) > 8 {
		suffix = sub[len(sub)-8:]
	}
	username = fmt.Sprintf("%s_%s", cleaned, suffix)

	// Still exists? append numbers
	i := 1
	candidate := username
	for exists(candidate) {
		candidate = fmt.Sprintf("%s%d", username, i)
		i++
	}

	return candidate
}

// createAuthResponse creates a standardized auth response
func (s *UserService) createAuthResponse(user *models.User, ipAddress, userAgent string, authMethod utils.AuthMethod) (*models.UserAuthResponse, error) {
	// Generate session
	sessionID := utils.GenerateSecureSessionID()
	token, expiresAt, err := s.jwtManager.GenerateToken(utils.NewUserTokenRequest(
		user.ID, user.Email, authMethod, sessionID,
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
		Message: "Authentication successful",
	}, nil
}

// UpdateUser updates user fields (username, name)
func (s *UserService) UpdateUser(userID int, username, name *string) (*models.User, error) {
	// Check if username is already taken (if provided)
	if username != nil {
		existingUser, err := s.userRepo.GetUserByUsername(*username)
		if err == nil && existingUser != nil && existingUser.ID != userID {
			return nil, fmt.Errorf("username %s is already taken", *username)
		}
	}

	// Update user in database
	updatedUser, err := s.userRepo.UpdateUser(userID, username, name)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return updatedUser, nil
}

// GetUserByUsername retrieves a user by username
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	return s.userRepo.GetUserByUsername(username)
}

// ChangePassword changes a user's password
func (s *UserService) ChangePassword(userID int, currentPassword, newPassword string) error {
	// Get user to verify current password
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword))
	if err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password in database
	err = s.userRepo.UpdatePassword(userID, string(hashedPassword))
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
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
