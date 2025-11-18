package middleware

// ContextKey is a type for context keys to avoid collisions
type ContextKey string

const (
	// UserKey is the context key for user object
	UserKey ContextKey = "user"
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "userID"
	// UserEmailKey is the context key for user email
	UserEmailKey ContextKey = "userEmail"
	// TokenKey is the context key for authentication token
	TokenKey ContextKey = "token"
	// CarIDKey is the context key for car ID
	CarIDKey ContextKey = "carID"
	// AdminIDKey is the context key for admin ID
	AdminIDKey ContextKey = "admin_id"
)
