package utils

import (
	"regexp"
	"strings"
)

// NormalizeChassis normalizes a chassis number for comparison
// - Converts to uppercase
// - Trims whitespace
// - Removes spaces, hyphens, and other common separators
func NormalizeChassis(chassis string) string {
	// Convert to uppercase
	chassis = strings.ToUpper(chassis)

	// Trim whitespace
	chassis = strings.TrimSpace(chassis)

	// Remove common separators: spaces, hyphens, underscores, dots
	re := regexp.MustCompile(`[\s\-_.]+`)
	chassis = re.ReplaceAllString(chassis, "")

	return chassis
}
