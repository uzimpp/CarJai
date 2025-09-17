package services

import (
	"context"
	"strings"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// MaintenanceService handles maintenance tasks
type MaintenanceService struct {
	adminRepo      *models.AdminRepository
	sessionRepo    *models.SessionRepository
	ipWhitelistRepo *models.IPWhitelistRepository
	logger         *utils.Logger
}

// NewMaintenanceService creates a new maintenance service
func NewMaintenanceService(
	adminRepo *models.AdminRepository,
	sessionRepo *models.SessionRepository,
	ipWhitelistRepo *models.IPWhitelistRepository,
	logger *utils.Logger,
) *MaintenanceService {
	return &MaintenanceService{
		adminRepo:      adminRepo,
		sessionRepo:    sessionRepo,
		ipWhitelistRepo: ipWhitelistRepo,
		logger:         logger,
	}
}

// MaintenanceConfig holds maintenance configuration
type MaintenanceConfig struct {
	SessionCleanupInterval time.Duration
	LogCleanupInterval     time.Duration
	MaxSessionAge          time.Duration
	MaxLogAge              time.Duration
}

// DefaultMaintenanceConfig returns default maintenance configuration
func DefaultMaintenanceConfig() *MaintenanceConfig {
	return &MaintenanceConfig{
		SessionCleanupInterval: 1 * time.Hour,  // Cleanup every hour
		LogCleanupInterval:     24 * time.Hour, // Cleanup logs daily
		MaxSessionAge:          24 * time.Hour, // Sessions expire after 24 hours
		MaxLogAge:              30 * 24 * time.Hour, // Keep logs for 30 days
	}
}

// StartMaintenance starts the maintenance service
func (s *MaintenanceService) StartMaintenance(ctx context.Context, config *MaintenanceConfig) {
	if config == nil {
		config = DefaultMaintenanceConfig()
	}
	
	s.logger.Info("Starting maintenance service")
	
	// Start session cleanup
	go s.runSessionCleanup(ctx, config.SessionCleanupInterval)
	
	// Start log cleanup (if implemented)
	go s.runLogCleanup(ctx, config.LogCleanupInterval)
	
	// Start health monitoring
	go s.runHealthMonitoring(ctx, 5*time.Minute)
}

// SeedAdminIfMissing seeds an admin and whitelist if none exist
func (s *MaintenanceService) SeedAdminIfMissing(adminUsername, adminPassword, adminName, adminIPWhitelist string) error {
	if adminUsername == "" || adminPassword == "" {
		return nil
	}
	// Check if admin exists
	if _, err := s.adminRepo.GetAdminByUsername(adminUsername); err == nil {
		return nil
	}
	// Hash password
	hashed, err := utils.HashPassword(adminPassword)
	if err != nil {
		return err
	}
	// Create admin
	admin := &models.Admin{
		Username:     adminUsername,
		PasswordHash: hashed,
		Name:         adminName,
	}
	if err := s.adminRepo.CreateAdmin(admin); err != nil {
		return err
	}
	// Seed whitelist
	if adminIPWhitelist != "" {
		parts := strings.Split(adminIPWhitelist, ",")
		for _, raw := range parts {
			cidr := strings.TrimSpace(raw)
			if cidr == "" {
				continue
			}
			_ = s.ipWhitelistRepo.AddIPToWhitelist(admin.ID, cidr, "Bootstrap")
		}
	}
	s.logger.WithField("username", adminUsername).Info("Seeded default admin from env")
	return nil
}

// runSessionCleanup runs periodic session cleanup
func (s *MaintenanceService) runSessionCleanup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	
	s.logger.Info("Session cleanup started")
	
	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Session cleanup stopped")
			return
		case <-ticker.C:
			s.cleanupExpiredSessions()
		}
	}
}

// runLogCleanup runs periodic log cleanup
func (s *MaintenanceService) runLogCleanup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	
	s.logger.Info("Log cleanup started")
	
	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Log cleanup stopped")
			return
		case <-ticker.C:
			s.cleanupOldLogs()
		}
	}
}

// runHealthMonitoring runs periodic health monitoring
func (s *MaintenanceService) runHealthMonitoring(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	
	s.logger.Info("Health monitoring started")
	
	for {
		select {
		case <-ctx.Done():
			s.logger.Info("Health monitoring stopped")
			return
		case <-ticker.C:
			s.checkSystemHealth()
		}
	}
}

// cleanupExpiredSessions removes expired sessions
func (s *MaintenanceService) cleanupExpiredSessions() {
	start := time.Now()
	
	deletedCount, err := s.sessionRepo.CleanupExpiredSessions()
	if err != nil {
		s.logger.WithField("error", err.Error()).Error("Failed to cleanup expired sessions")
		return
	}
	
	duration := time.Since(start)
	s.logger.WithFields(map[string]interface{}{
		"deleted_sessions": deletedCount,
		"duration":         duration.String(),
	}).Info("Session cleanup completed")
}

// cleanupOldLogs removes old log entries (placeholder for future implementation)
func (s *MaintenanceService) cleanupOldLogs() {
	// This is a placeholder for log cleanup
	// In a real implementation, you would clean up old log files or database log entries
	s.logger.Debug("Log cleanup completed (placeholder)")
}

// checkSystemHealth checks system health
func (s *MaintenanceService) checkSystemHealth() {
	// Check database connectivity
	// This would be implemented based on your database setup
	s.logger.Debug("System health check completed")
}

// GetSystemStats returns system statistics
func (s *MaintenanceService) GetSystemStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Get admin count
	// This would require implementing a count method in the repository
	// For now, we'll use a placeholder
	
	stats["timestamp"] = time.Now()
	stats["uptime"] = time.Since(time.Now()).String() // This should be actual uptime
	
	return stats, nil
}

// ForceCleanupExpiredSessions manually triggers session cleanup
func (s *MaintenanceService) ForceCleanupExpiredSessions() (int64, error) {
	s.logger.Info("Manual session cleanup triggered")
	return s.sessionRepo.CleanupExpiredSessions()
}

// GetActiveSessionsCount returns the count of active sessions
func (s *MaintenanceService) GetActiveSessionsCount() (int, error) {
	// This would require implementing a count method in the session repository
	// For now, we'll return a placeholder
	return 0, nil
}

// GetExpiredSessionsCount returns the count of expired sessions
func (s *MaintenanceService) GetExpiredSessionsCount() (int, error) {
	// This would require implementing a count method in the session repository
	// For now, we'll return a placeholder
	return 0, nil
}
