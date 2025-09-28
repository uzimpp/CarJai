package utils

import (
	"fmt"
	"os"
	"strconv"
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
