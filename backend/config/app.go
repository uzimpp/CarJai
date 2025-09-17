package config

// AppConfig holds application configuration
type AppConfig struct {
	Port               string
	AdminRoutePrefix   string
	Environment        string
	AdminUsername      string
	AdminPassword      string
	AdminName          string
	AdminIPWhitelist   string
	CORSAllowedOrigins string
	AigenAPIKey        string `env:"AIGEN_API_KEY,required"`
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
	return &AppConfig{
		Port:               getEnv("PORT"),
		AdminRoutePrefix:   getEnv("ADMIN_ROUTE_PREFIX"),
		Environment:        getEnv("ENVIRONMENT"),
		AdminUsername:      getEnv("ADMIN_USERNAME"),
		AdminPassword:      getEnv("ADMIN_PASSWORD"),
		AdminName:          getEnv("ADMIN_NAME"),
		AdminIPWhitelist:   getEnv("ADMIN_IP_WHITELIST"),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS"),
		// User JWT config
		UserJWTSecret:      getEnv("USER_JWT_SECRET"),
		UserJWTExpiration:  getEnvAsInt("USER_JWT_EXPIRATION_HOURS"),
		UserJWTIssuer:      getEnv("USER_JWT_ISSUER"),
		// Admin JWT config
		AdminJWTSecret:     getEnv("ADMIN_JWT_SECRET"),
		AdminJWTExpiration: getEnvAsInt("ADMIN_JWT_EXPIRATION_HOURS"),
		AdminJWTIssuer:     getEnv("ADMIN_JWT_ISSUER"),
		AigenAPIKey: getEnv("AIGEN_API_KEY"),
	}
}
