package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

// LogLevel represents the log level
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp time.Time              `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	RequestID string                 `json:"request_id,omitempty"`
	AdminID   string                 `json:"admin_id,omitempty"`
	IPAddress string                 `json:"ip_address,omitempty"`
	UserAgent string                 `json:"user_agent,omitempty"`
}

// Logger represents a structured logger
type Logger struct {
	level  LogLevel
	fields map[string]interface{}
}

// NewLogger creates a new logger
func NewLogger(level LogLevel) *Logger {
	return &Logger{
		level:  level,
		fields: make(map[string]interface{}),
	}
}

// WithField adds a field to the logger
func (l *Logger) WithField(key string, value interface{}) *Logger {
	newLogger := &Logger{
		level:  l.level,
		fields: make(map[string]interface{}),
	}

	// Copy existing fields
	for k, v := range l.fields {
		newLogger.fields[k] = v
	}

	// Add new field
	newLogger.fields[key] = value
	return newLogger
}

// WithFields adds multiple fields to the logger
func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	newLogger := &Logger{
		level:  l.level,
		fields: make(map[string]interface{}),
	}

	// Copy existing fields
	for k, v := range l.fields {
		newLogger.fields[k] = v
	}

	// Add new fields
	for k, v := range fields {
		newLogger.fields[k] = v
	}

	return newLogger
}

// log writes a log entry
func (l *Logger) log(level LogLevel, message string) {
	if level < l.level {
		return
	}

	levelNames := map[LogLevel]string{
		DEBUG: "DEBUG",
		INFO:  "INFO",
		WARN:  "WARN",
		ERROR: "ERROR",
		FATAL: "FATAL",
	}

	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     levelNames[level],
		Message:   message,
		Fields:    l.fields,
	}

	// Output as JSON
	jsonData, err := json.Marshal(entry)
	if err != nil {
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	log.Println(string(jsonData))

	// Exit on fatal
	if level == FATAL {
		os.Exit(1)
	}
}

// Debug logs a debug message
func (l *Logger) Debug(message string) {
	l.log(DEBUG, message)
}

// Info logs an info message
func (l *Logger) Info(message string) {
	l.log(INFO, message)
}

// Warn logs a warning message
func (l *Logger) Warn(message string) {
	l.log(WARN, message)
}

// Error logs an error message
func (l *Logger) Error(message string) {
	l.log(ERROR, message)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(message string) {
	l.log(FATAL, message)
}

// LogAdminAction logs an admin action
func (l *Logger) LogAdminAction(adminID int, action, resource string, details map[string]interface{}) {
	fields := map[string]interface{}{
		"admin_id": adminID,
		"action":   action,
		"resource": resource,
	}

	// Add details if provided
	for k, v := range details {
		fields[k] = v
	}

	l.WithFields(fields).Info(fmt.Sprintf("Admin action: %s on %s", action, resource))
}

// LogSecurityEvent logs a security event
func (l *Logger) LogSecurityEvent(eventType, description string, details map[string]interface{}) {
	fields := map[string]interface{}{
		"event_type":  eventType,
		"description": description,
	}

	// Add details if provided
	for k, v := range details {
		fields[k] = v
	}

	l.WithFields(fields).Warn(fmt.Sprintf("Security event: %s - %s", eventType, description))
}

// LogFailedSignin logs a failed login attempt
func (l *Logger) LogFailedSignin(username, ipAddress, userAgent, reason string) {
	fields := map[string]interface{}{
		"username":   username,
		"ip_address": ipAddress,
		"user_agent": userAgent,
		"reason":     reason,
	}

	l.WithFields(fields).Warn("Failed login attempt")
}

// LogSuccessfulSignin logs a successful login
func (l *Logger) LogSuccessfulSignin(adminID int, username, ipAddress, userAgent string) {
	fields := map[string]interface{}{
		"admin_id":   adminID,
		"username":   username,
		"ip_address": ipAddress,
		"user_agent": userAgent,
	}

	l.WithFields(fields).Info("Successful login")
}

// LogIPWhitelistChange logs IP whitelist changes
func (l *Logger) LogIPWhitelistChange(adminID int, action, ipAddress, description string) {
	fields := map[string]interface{}{
		"admin_id":    adminID,
		"action":      action,
		"ip_address":  ipAddress,
		"description": description,
	}

	l.WithFields(fields).Info(fmt.Sprintf("IP whitelist %s: %s", action, ipAddress))
}

// Global logger instance
var AppLogger = NewLogger(INFO)

// SetLogLevel sets the global log level
func SetLogLevel(level LogLevel) {
	AppLogger.level = level
}

// GetLogLevelFromString converts string to LogLevel
func GetLogLevelFromString(level string) LogLevel {
	switch level {
	case "DEBUG":
		return DEBUG
	case "INFO":
		return INFO
	case "WARN":
		return WARN
	case "ERROR":
		return ERROR
	case "FATAL":
		return FATAL
	default:
		return INFO
	}
}
