package utils

import (
	"strings"
)

// NormalizeChassis normalizes a chassis number for comparison
func NormalizeChassis(chassis string) string {
	// Trim whitespace
	chassis = strings.TrimSpace(chassis)

	// Convert to uppercase
	chassis = strings.ToUpper(chassis)
	return chassis
}
