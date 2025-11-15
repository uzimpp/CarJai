package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

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

// GetManagedUsers retrieves all users with their roles for the admin panel
func (s *UserService) GetManagedUsers() (*[]models.AdminManagedUser, error) {
	users, err := s.userRepo.GetManagedUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get managed users: %w", err)
	}
	return users, nil
}

// UpdateUserByAdmin updates a user's details (called by an admin)
func (s *UserService) UpdateUserByAdmin(userID int, data models.AdminUpdateUserRequest) (*models.User, error) {
	// Check if username is already taken (if provided)
	if data.Username != nil {
		existingUser, err := s.userRepo.GetUserByUsername(*data.Username)
		if err == nil && existingUser != nil && existingUser.ID != userID {
			return nil, fmt.Errorf("username %s is already taken", *data.Username)
		}
	}

	// Check if email is already taken (if provided)
	if data.Email != nil {
		existingUser, err := s.userRepo.GetUserByEmail(*data.Email)
		if err == nil && existingUser != nil && existingUser.ID != userID {
			return nil, fmt.Errorf("email %s is already in use", *data.Email)
		}
	}

	// Update user in database
	updatedUser, err := s.userRepo.UpdateUserByAdmin(userID, data)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return updatedUser, nil
}

// DeleteUserByAdmin deletes a user and all their sessions (called by an admin)
func (s *UserService) DeleteUserByAdmin(userID int) error {
	// Delete all user sessions
	// (We don't care about the error too much, but it's good to try)
	_, _ = s.userSessionRepo.DeleteAllSessionsForUser(userID)

	// Delete the user
	err := s.userRepo.DeleteUser(userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// CreateUserByAdmin creates a new user (called by an admin)
func (s *UserService) CreateUserByAdmin(req models.AdminCreateUserRequest) (*models.User, error) {
	// Check if user already exists by email
	existingUser, err := s.userRepo.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", req.Email)
	}

	// Check if username already exists
	existingUserByUsername, err := s.userRepo.GetUserByUsername(req.Username)
	if err == nil && existingUserByUsername != nil {
		return nil, fmt.Errorf("username %s is already taken", req.Username)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:        req.Email,
		Username:     req.Username,
		Name:         req.Name,
		PasswordHash: string(hashedPassword),
	}

	err = s.userRepo.CreateUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
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

	// Check if user is banned by checking seller/buyer status
	var sellerStatus, buyerStatus string
	if s.profileService != nil {
		sellerStatus, _ = s.profileService.GetSellerStatus(user.ID)
		buyerStatus, _ = s.profileService.GetBuyerStatus(user.ID)
	}
	
	if sellerStatus == "banned" || buyerStatus == "banned" {
		return nil, fmt.Errorf("your account has been banned")
	}
	if sellerStatus == "suspended" || buyerStatus == "suspended" {
		return nil, fmt.Errorf("your account has been suspended")
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

// SigninWithGoogleIDToken validates a Google ID token and signs in (or creates) the user
func (s *UserService) SigninWithGoogleIDToken(idToken, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	// Validate Google ID token using tokeninfo endpoint (simple server-side validation)
	clientID := utils.GetEnv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		return nil, fmt.Errorf("google client id not configured")
	}

	tokenInfoURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken)
	resp, err := http.Get(tokenInfoURL)
	if err != nil {
		return nil, fmt.Errorf("failed to validate google id token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return nil, fmt.Errorf("invalid google id token: status %d", resp.StatusCode)
	}

	var ti struct {
		Sub           string `json:"sub"`
		Aud           string `json:"aud"`
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Name          string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ti); err != nil {
		return nil, fmt.Errorf("failed to parse token info: %w", err)
	}

	if ti.Aud != clientID {
		return nil, fmt.Errorf("invalid token audience")
	}
	if ti.Email == "" || !(ti.EmailVerified == "true" || ti.EmailVerified == "1") {
		return nil, fmt.Errorf("email not verified by google")
	}
	if ti.Sub == "" {
		return nil, fmt.Errorf("missing google user id")
	}

	// Try finding user by Google ID
	user, err := s.userRepo.GetUserByGoogleID(ti.Sub)
	if err != nil {
		// If not found by Google ID, try by email
		user, err = s.userRepo.GetUserByEmail(ti.Email)
		if err == nil && user != nil {
			// Link Google account to existing user
			if err := s.userRepo.LinkGoogleAccount(user.ID, ti.Sub); err != nil {
				return nil, fmt.Errorf("failed to link google account: %w", err)
			}
			gid := ti.Sub
			provider := "google"
			linked := time.Now()
			user.GoogleID = &gid
			user.AuthProvider = &provider
			user.LinkedAt = &linked
		} else {
			// Create new user
			baseUsername := generateUsernameFromEmail(ti.Email)
			username := baseUsername
			// Ensure unique username with limited attempts
			for i := 0; i < 5; i++ {
				if existing, err := s.userRepo.GetUserByUsername(username); err != nil || existing == nil {
					break
				}
				username = baseUsername
				if len(username) > 16 {
					username = username[:16]
				}
				suffix := utils.GenerateSecureSessionID()
				if len(suffix) > 4 {
					suffix = suffix[:4]
				}
				username = username + suffix
			}

			displayName := ti.Name
			if strings.TrimSpace(displayName) == "" {
				displayName = baseUsername
			}

			gid := ti.Sub
			provider := "google"
			now := time.Now()

			newUser := &models.User{
				Email:        ti.Email,
				Username:     username,
				Name:         displayName,
				PasswordHash: "",
				GoogleID:     &gid,
				AuthProvider: &provider,
				LinkedAt:     &now,
			}

			if err := s.userRepo.CreateUserWithGoogle(newUser); err != nil {
				return nil, fmt.Errorf("failed to create user: %w", err)
			}
			user = newUser
		}
	}

	// Check if user is banned by checking seller/buyer status
	var sellerStatus, buyerStatus string
	if s.profileService != nil {
		sellerStatus, _ = s.profileService.GetSellerStatus(user.ID)
		buyerStatus, _ = s.profileService.GetBuyerStatus(user.ID)
	}
	
	if sellerStatus == "banned" || buyerStatus == "banned" {
		return nil, fmt.Errorf("your account has been banned")
	}
	if sellerStatus == "suspended" || buyerStatus == "suspended" {
		return nil, fmt.Errorf("your account has been suspended")
	}

	// Generate session
	sessionID := utils.GenerateSecureSessionID()
	token, expiresAt, err := s.jwtManager.GenerateToken(utils.NewUserTokenRequest(
		user.ID, user.Email, utils.AuthGoogle, sessionID,
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

	if err := s.userSessionRepo.CreateUserSession(session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &models.UserAuthResponse{
		Success: true,
		Data: models.UserAuthData{
			User:      user.ToPublic(),
			Token:     token,
			ExpiresAt: expiresAt,
		},
		Message: "Sign in with Google successful",
	}, nil
}

// generateUsernameFromEmail creates a safe username from email local-part
func generateUsernameFromEmail(email string) string {
	local := email
	if at := strings.Index(email, "@"); at != -1 {
		local = email[:at]
	}
	// only allow [a-z0-9_], lowercase
	local = strings.ToLower(local)
	var b strings.Builder
	for _, r := range local {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			b.WriteRune(r)
		}
	}
	uname := b.String()
	if len(uname) < 3 {
		uname = "user_" + utils.GenerateSecureSessionID()
		if len(uname) > 12 {
			uname = uname[:12]
		}
	}
	if len(uname) > 20 {
		uname = uname[:20]
	}
	return uname
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

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(userID int) (*models.User, error) {
	return s.userRepo.GetUserByID(userID)
}
