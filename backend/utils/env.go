package utils

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// GetEnv gets an environment variable and fails if not found
func GetEnv(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	panic(fmt.Sprintf("Required environment variable '%s' is not set", key))
}

// GetEnvAsInt gets an environment variable as integer and fails if not found
func GetEnvAsInt(key string) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		panic(fmt.Sprintf("Environment variable '%s' has invalid integer value: %s", key, value))
	}
	panic(fmt.Sprintf("Required integer environment variable '%s' is not set", key))
}

// GetEnvAsBool gets an environment variable as boolean
// Returns true for "true", "1", "yes", "on" (case-insensitive)
// Returns false for "false", "0", "no", "off" or if not set
func GetEnvAsBool(key string) bool {
	value := os.Getenv(key)
	if value == "" {
		return false
	}
	value = strings.ToLower(strings.TrimSpace(value))
	return value == "true" || value == "1" || value == "yes" || value == "on"
}
