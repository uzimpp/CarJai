package config

// AppConfig holds application configuration
type AppConfig struct {
	Port             string
	JWTSecret        string
	JWTExpiration    int // in hours
	AdminRoutePrefix string
	Environment      string
	AdminUsername    string
	AdminPassword    string
	AdminName        string
	AdminIPWhitelist string
}

// LoadAppConfig loads application configuration from environment variables
func LoadAppConfig() *AppConfig {
	return &AppConfig{
		Port:             getEnv("PORT"),
		JWTSecret:        getEnv("JWT_SECRET"),
		JWTExpiration:    getEnvAsInt("JWT_EXPIRATION_HOURS"),
		AdminRoutePrefix: getEnv("ADMIN_ROUTE_PREFIX"),
		Environment:      getEnv("ENVIRONMENT"),
		AdminUsername:    getEnv("ADMIN_USERNAME"),
		AdminPassword:    getEnv("ADMIN_PASSWORD"),
		AdminName:        getEnv("ADMIN_NAME"),
		AdminIPWhitelist: getEnv("ADMIN_IP_WHITELIST"),
	}
}

// Helper functions are now in env.go
