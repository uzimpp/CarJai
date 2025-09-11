package config

import (
	"fmt"
	"os"
	"strconv"
)

// getEnv gets an environment variable and fails if not found
func getEnv(key string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	panic(fmt.Sprintf("Required environment variable '%s' is not set", key))
}

// getEnvAsInt gets an environment variable as integer and fails if not found
func getEnvAsInt(key string) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		panic(fmt.Sprintf("Environment variable '%s' has invalid integer value: %s", key, value))
	}
	panic(fmt.Sprintf("Required environment variable '%s' is not set", key))
}
