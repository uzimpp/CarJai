package utils

import (
	"fmt"
	"net"
	"strings"
)

// ValidateIPAddress validates if an IP address is valid
func ValidateIPAddress(ip string) error {
	if ip == "" {
		return fmt.Errorf("IP address cannot be empty")
	}
	
	// Check if it's a CIDR notation
	if strings.Contains(ip, "/") {
		_, _, err := net.ParseCIDR(ip)
		if err != nil {
			return fmt.Errorf("invalid CIDR notation: %w", err)
		}
		return nil
	}
	
	// Check if it's a regular IP address
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return fmt.Errorf("invalid IP address format")
	}
	
	return nil
}

// IsIPInRange checks if an IP address is within a CIDR range
func IsIPInRange(ip, cidr string) (bool, error) {
	// Parse the IP address
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return false, fmt.Errorf("invalid IP address: %s", ip)
	}
	
	// Parse the CIDR range
	_, network, err := net.ParseCIDR(cidr)
	if err != nil {
		return false, fmt.Errorf("invalid CIDR range: %w", err)
	}
	
	// Check if IP is in the network
	return network.Contains(parsedIP), nil
}

// IsIPWhitelisted checks if an IP address is whitelisted against a list of allowed IPs/CIDRs
func IsIPWhitelisted(clientIP string, whitelist []string) (bool, error) {
	if len(whitelist) == 0 {
		return false, fmt.Errorf("whitelist is empty")
	}
	
	for _, allowedIP := range whitelist {
		// If it's a CIDR range
		if strings.Contains(allowedIP, "/") {
			inRange, err := IsIPInRange(clientIP, allowedIP)
			if err != nil {
				continue // Skip invalid CIDR entries
			}
			if inRange {
				return true, nil
			}
		} else {
			// Direct IP match
			if clientIP == allowedIP {
				return true, nil
			}
		}
	}
	
	return false, nil
}

// ExtractClientIP extracts the real client IP from HTTP request headers
func ExtractClientIP(remoteAddr, xForwardedFor, xRealIP string) string {
	// Priority order: X-Real-IP > X-Forwarded-For > RemoteAddr
	// Check X-Real-IP header first
	if xRealIP != "" {
		// X-Real-IP should contain a single IP
		ip := net.ParseIP(xRealIP)
		if ip != nil {
			return ip.String()
		}
	}

	// Check X-Forwarded-For header
	if xForwardedFor != "" {
		// X-Forwarded-For can contain multiple IPs separated by commas
		// The first IP is usually the original client IP
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			// Trim whitespace and get the first IP
			firstIP := strings.TrimSpace(ips[0])
			ip := net.ParseIP(firstIP)
			if ip != nil {
				return ip.String()
			}
		}
	}
	
	// Fall back to RemoteAddr
	if remoteAddr != "" {
		// RemoteAddr is usually in format "IP:port"
		host, _, err := net.SplitHostPort(remoteAddr)
		if err == nil {
			ip := net.ParseIP(host)
			if ip != nil {
				return ip.String()
			}
		}
	}
	
	return ""
}

// NormalizeIPAddress normalizes an IP address to its canonical form
func NormalizeIPAddress(ip string) (string, error) {
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return "", fmt.Errorf("invalid IP address: %s", ip)
	}
	
	// Convert to IPv4 if it's an IPv4-mapped IPv6 address
	if ipv4 := parsedIP.To4(); ipv4 != nil {
		return ipv4.String(), nil
	}
	
	// Return IPv6 in canonical form
	return parsedIP.String(), nil
}
