package config

import (
	"log"
	"strings"

	"github.com/uzimpp/CarJai/backend/utils"
)

// AppConfig holds application configuration
type AppConfig struct {
	Port               string
	AdminRoutePrefix   string
	Environment        string
	AdminUsername      string
	AdminPassword      string
	AdminName          string
	AdminIPWhitelist   []string
	CORSAllowedOrigins []string
	AigenAPIKey        string `env:"AIGEN_API_KEY,required"`
	// Google OAuth configuration
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURI  string
	// General backend URL (used for constructing absolute callback URLs)
	BackendURL string
	// Separate JWT configs for user and admin
	UserJWTSecret      string
	UserJWTExpiration  int // in hours
	UserJWTIssuer      string
	AdminJWTSecret     string
	AdminJWTExpiration int // in hours
	AdminJWTIssuer     string
}

// LoadAppConfig loads application configuration from environment variables
func LoadAppConfig() *AppConfig {
	// parse allowed IPs and origins into arrays
	allowedIPs := parseAllowedIPs(utils.GetEnv("ADMIN_IP_WHITELIST"))
	allowedOrigins := parseCORSOrigins(utils.GetEnv("CORS_ALLOWED_ORIGINS"))

	return &AppConfig{
		Port:               utils.GetEnv("PORT"),
		AdminRoutePrefix:   utils.GetEnv("ADMIN_ROUTE_PREFIX"),
		Environment:        utils.GetEnv("ENVIRONMENT"),
		AdminUsername:      utils.GetEnv("ADMIN_USERNAME"),
		AdminPassword:      utils.GetEnv("ADMIN_PASSWORD"),
		AdminName:          utils.GetEnv("ADMIN_NAME"),
		AdminIPWhitelist:   allowedIPs,
		CORSAllowedOrigins: allowedOrigins,
		// Google OAuth
		GoogleClientID:     utils.GetEnv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: utils.GetEnv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURI:  utils.GetEnv("GOOGLE_REDIRECT_URI"),
		BackendURL:         utils.GetEnv("BACKEND_URL"),
		// User JWT configs
		UserJWTSecret:     utils.GetEnv("USER_JWT_SECRET"),
		UserJWTExpiration: utils.GetEnvAsInt("USER_JWT_EXPIRATION_HOURS"),
		UserJWTIssuer:     utils.GetEnv("USER_JWT_ISSUER"),
		// Admin JWT configs
		AdminJWTSecret:     utils.GetEnv("ADMIN_JWT_SECRET"),
		AdminJWTExpiration: utils.GetEnvAsInt("ADMIN_JWT_EXPIRATION_HOURS"),
		AdminJWTIssuer:     utils.GetEnv("ADMIN_JWT_ISSUER"),
		AigenAPIKey:        utils.GetEnv("AIGEN_API_KEY"),
	}
}

// parseAllowedIPs parses comma-separated IP addresses into a slice
func parseAllowedIPs(ipWhitelist string) []string {
	if ipWhitelist == "" {
		log.Fatal("ADMIN_IP_WHITELIST environment variable is required for security")
	}

	ips := strings.Split(ipWhitelist, ",")
	allowedIPs := make([]string, 0, len(ips))
	for _, ip := range ips {
		trimmedIP := strings.TrimSpace(ip)
		if trimmedIP != "" {
			allowedIPs = append(allowedIPs, trimmedIP)
		}
	}
	return allowedIPs
}

// parseCORSOrigins parses comma-separated CORS origins into a slice
func parseCORSOrigins(corsOrigins string) []string {
	originsList := strings.Split(corsOrigins, ",")
	allowedOrigins := make([]string, 0, len(originsList))
	for _, origin := range originsList {
		trimmedOrigin := strings.TrimSpace(origin)
		if trimmedOrigin != "" {
			allowedOrigins = append(allowedOrigins, trimmedOrigin)
		}
	}
	return allowedOrigins
}
