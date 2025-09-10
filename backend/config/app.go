package config

import (
	"os"
	"strconv"
)

// AppConfig holds application configuration
type AppConfig struct {
	Port            string
	JWTSecret       string
	JWTExpiration   int // in hours
	AdminRoutePrefix string
	Environment     string
}

// LoadAppConfig loads application configuration from environment variables
func LoadAppConfig() *AppConfig {
	return &AppConfig{
		Port:            getEnv("PORT", "8080"),
		JWTSecret:       getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpiration:   getEnvAsInt("JWT_EXPIRATION_HOURS", 8),
		AdminRoutePrefix: getEnv("ADMIN_ROUTE_PREFIX", "/admin"),
		Environment:     getEnv("ENVIRONMENT", "development"),
	}
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
