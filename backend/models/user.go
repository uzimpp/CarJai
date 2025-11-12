package models

import (
	"time"
)

// User represents a regular user in the system
type User struct {
    ID           int       `json:"id" db:"id"`
    Email        string    `json:"email" db:"email"`
    Username     string    `json:"username" db:"username"`
    Name         string    `json:"name" db:"name"`
    PasswordHash string    `json:"-" db:"password_hash"`
    GoogleID     *string   `json:"googleId,omitempty" db:"google_id"`
    AuthProvider *string   `json:"provider,omitempty" db:"auth_provider"`
    LinkedAt     *time.Time `json:"linkedAt,omitempty" db:"provider_linked_at"`
    CreatedAt    time.Time `json:"created_at" db:"created_at"`
    UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserSession represents an active user session
type UserSession struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Token     string    `json:"token" db:"token"`
	IPAddress string    `json:"ip_address" db:"ip_address"`
	UserAgent string    `json:"user_agent" db:"user_agent"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// UserSignupRequest represents the request payload for user signup
type UserSignupRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Username string `json:"username" validate:"required,min=3,max=20"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
}

// UserSigninRequest represents the request payload for user sign in
type UserSigninRequest struct {
    EmailOrUsername string `json:"email_or_username" validate:"required"`
    Password        string `json:"password" validate:"required,min=6"`
}

// UserGoogleSigninRequest represents the request payload for Google sign in using ID token
type UserGoogleSigninRequest struct {
    IDToken string `json:"id_token" validate:"required"`
}

// UserUpdateSelfRequest represents the request payload for PATCH /api/profile/self
type UserUpdateSelfRequest struct {
	Username *string `json:"username,omitempty" validate:"omitempty,min=3,max=20"`
	Name     *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
}

// ChangePasswordRequest represents the request payload for POST /api/profile/change-password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// ChangePasswordResponse represents the response for password change
type ChangePasswordResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// UserAuthResponse represents the response payload for successful authentication
type UserAuthResponse struct {
	Success bool         `json:"success"`
	Data    UserAuthData `json:"data"`
	Message string       `json:"message,omitempty"`
}

// UserAuthData contains the authentication data returned after signin/signup
type UserAuthData struct {
	User      UserPublic `json:"user"`
	Token     string     `json:"token"`
	ExpiresAt time.Time  `json:"expires_at"`
}

// UserPublic represents user data that can be safely returned to client
type UserPublic struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserMeResponse represents the response payload for GET /api/auth/me
type UserMeResponse struct {
	Success bool       `json:"success"`
	Data    UserMeData `json:"data"`
}

// UserMeData contains the current user session information with roles and completeness
type UserMeData struct {
	User     UserPublic   `json:"user"`
	Roles    UserRoles    `json:"roles"`
	Profiles UserProfiles `json:"profiles"`
}

// UserRoles indicates which roles a user has
type UserRoles struct {
	Buyer  bool `json:"buyer"`
	Seller bool `json:"seller"`
}

// UserProfiles indicates completeness of each role profile
type UserProfiles struct {
	BuyerComplete  bool `json:"buyerComplete"`
	SellerComplete bool `json:"sellerComplete"`
}

// UserSignoutResponse represents the response payload for user sign out
type UserSignoutResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// UserErrorResponse represents error response structure
type UserErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
}

// ToPublic converts User to UserPublic (removes sensitive data)
func (u *User) ToPublic() UserPublic {
	return UserPublic{
		ID:        u.ID,
		Email:     u.Email,
		Username:  u.Username,
		Name:      u.Name,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// IsExpired checks if the user session has expired
func (s *UserSession) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsValid checks if the user session is valid (not expired)
func (s *UserSession) IsValid() bool {
	return !s.IsExpired()
}

type AdminManagedUser struct {
	ID        int       `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Name      string    `json:"name" db:"name"`
	Email     *string   `json:"email" db:"email"` // ใช้ pointer เผื่อเป็น null
	Role      string    `json:"role" db:"role"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	Type      string    `json:"type" db:"type"` 
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// AdminCreateUserRequest represents the request payload for POST /admin/users
type AdminCreateUserRequest struct {
    Name     string `json:"name" validate:"required,min=2,max=100"`
    Username string `json:"username" validate:"required,min=3,max=20"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=6"`
}

// AdminUpdateUserRequest matches the request from page.tsx EditUserModal
type AdminUpdateUserRequest struct {
	Name     *string `json:"name,omitempty"`
	Username *string `json:"username,omitempty"`
	Email    *string `json:"email,omitempty"`
}

// AdminCreateUserRequest represents the request payload for POST /admin/users
type AdminCreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Username string `json:"username" validate:"required,min=3,max=20"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// AdminUsersListResponse is the response for GET /admin/users
type AdminUsersListResponse struct {
	Success bool               `json:"success"`
	Data    []AdminManagedUser `json:"data"`
	Total   int                `json:"total"`
}

// Buyer represents a buyer profile
type Buyer struct {
	ID        int     `json:"id" db:"id"`
	Province  *string `json:"province" db:"province"`
	BudgetMin *int    `json:"budgetMin" db:"budget_min"`
	BudgetMax *int    `json:"budgetMax" db:"budget_max"`
}

// Seller represents a seller profile
type Seller struct {
	ID          int     `json:"id" db:"id"`
	DisplayName string  `json:"displayName" db:"display_name"`
	About       *string `json:"about" db:"about"`
	MapLink     *string `json:"mapLink" db:"map_link"`
}

// SellerContact represents a seller's contact information
type SellerContact struct {
	ID          int     `json:"id" db:"id"`
	SellerID    int     `json:"sellerId" db:"seller_id"`
	ContactType string  `json:"contactType" db:"contact_type"`
	Value       string  `json:"value" db:"value"`
	Label       *string `json:"label" db:"label"`
}

// BuyerRequest represents the request payload for creating/updating buyer profile
type BuyerRequest struct {
	Province  *string `json:"province"`
	BudgetMin *int    `json:"budgetMin"`
	BudgetMax *int    `json:"budgetMax"`
}

// SellerRequest represents the request payload for creating/updating seller profile
type SellerRequest struct {
	DisplayName string                 `json:"displayName" validate:"required,max=50"`
	About       *string                `json:"about" validate:"omitempty,max=200"`
	MapLink     *string                `json:"mapLink"`
	Contacts    []SellerContactRequest `json:"contacts"`
}

// SellerContactRequest represents a contact in the seller request
type SellerContactRequest struct {
	ContactType string  `json:"contactType" validate:"required,max=20"`
	Value       string  `json:"value" validate:"required"`
	Label       *string `json:"label" validate:"omitempty,max=80"`
}

// ProfileResponse represents the full profile aggregate response
type ProfileResponse struct {
	Success bool        `json:"success"`
	Data    ProfileData `json:"data"`
}

// ProfileData contains all user profile information
type ProfileData struct {
	User     UserPublic      `json:"user"`
	Roles    UserRoles       `json:"roles"`
	Profiles UserProfiles    `json:"profiles"`
	Buyer    *Buyer          `json:"buyer,omitempty"`
	Seller   *Seller         `json:"seller,omitempty"`
	Contacts []SellerContact `json:"contacts,omitempty"`
}

// BuyerResponse represents the buyer profile response
type BuyerResponse struct {
	Success bool   `json:"success"`
	Data    Buyer  `json:"data"`
	Message string `json:"message,omitempty"`
}

// SellerResponse represents the seller profile response
type SellerResponse struct {
	Success bool       `json:"success"`
	Data    SellerData `json:"data"`
	Message string     `json:"message,omitempty"`
}

// SellerData contains seller profile with contacts
type SellerData struct {
	Seller   Seller          `json:"seller"`
	Contacts []SellerContact `json:"contacts"`
}

// IsBuyerComplete checks if buyer profile is complete
func (b *Buyer) IsComplete() bool {
	return b.BudgetMin != nil && b.BudgetMax != nil && b.Province != nil && *b.Province != ""
}

// IsSellerComplete checks if seller profile is complete
func (s *Seller) IsComplete() bool {
	trimmed := ""
	if s.DisplayName != "" {
		trimmed = s.DisplayName
		// Check if it's not just whitespace
		for _, c := range trimmed {
			if c != ' ' && c != '\t' && c != '\n' && c != '\r' {
				return len(trimmed) <= 50
			}
		}
	}
	return false
}

// RecentView represents a user's car viewing history entry
type RecentView struct {
	RVID     int       `json:"rvid" db:"rvid"`
	UserID   int       `json:"user_id" db:"user_id"`
	CarID    int       `json:"car_id" db:"car_id"`
	ViewedAt time.Time `json:"viewed_at" db:"viewed_at"`
}

// RecentViewWithCarDetails represents a recent view with car information
type RecentViewWithCarDetails struct {
	RVID              int       `json:"rvid" db:"rvid"`
	UserID            int       `json:"user_id" db:"user_id"`
	CarID             int       `json:"car_id" db:"car_id"`
	ViewedAt          time.Time `json:"viewed_at" db:"viewed_at"`
	Year              *int      `json:"year" db:"year"`
	Mileage           *int      `json:"mileage" db:"mileage"`
	Price             int       `json:"price" db:"price"`
	Province          *string   `json:"province" db:"province"`
	ConditionRating   *int      `json:"condition_rating" db:"condition_rating"`
	Color             *string   `json:"color" db:"color"`
	Status            string    `json:"status" db:"status"`
	BrandName         *string   `json:"brand_name" db:"brand_name"`
	ModelName         *string   `json:"model_name" db:"model_name"`
	SellerDisplayName string    `json:"seller_display_name" db:"seller_display_name"`
}

// RecentViewRequest represents the request payload for recording a car view
type RecentViewRequest struct {
	CarID int `json:"car_id" validate:"required,min=1"`
}

// RecentViewsResponse represents the response for getting recent views
type RecentViewsResponse struct {
	Success bool                       `json:"success"`
	Data    []RecentViewWithCarDetails `json:"data"`
	Message string                     `json:"message,omitempty"`
}

// RecordViewResponse represents the response for recording a view
type RecordViewResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
