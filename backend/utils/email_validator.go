package utils

import (
	"fmt"
	"net"
	"regexp"
	"strings"
)

// IsValidEmailFormat checks if email matches basic format
func IsValidEmailFormat(email string) bool {
	if email == "" {
		return false
	}

	// RFC 5322 simplified pattern
	pattern := `^[a-zA-Z0-9.!#$%&'*+/=?^_` + "`" + `{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`

	matched, err := regexp.MatchString(pattern, email)
	if err != nil {
		return false
	}

	return matched && len(email) <= 254
}

// HasValidEmailDomain checks if the email domain has MX records
func HasValidEmailDomain(email string) bool {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	domain := parts[1]

	// Check MX records
	mxRecords, err := net.LookupMX(domain)
	if err != nil {
		return false
	}

	return len(mxRecords) > 0
}

// ValidateEmailForSignup performs comprehensive validation
func ValidateEmailForSignup(email string) error {
	// Format check
	if !IsValidEmailFormat(email) {
		return fmt.Errorf("invalid email format")
	}

	// Domain check
	if !HasValidEmailDomain(email) {
		return fmt.Errorf("email domain does not exist or cannot receive emails")
	}

	return nil
}
