package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// RateLimiter represents a rate limiter
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// IsAllowed checks if a request is allowed for the given key
func (rl *RateLimiter) IsAllowed(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()
	
	now := time.Now()
	cutoff := now.Add(-rl.window)
	
	// Get existing requests for this key
	requests, exists := rl.requests[key]
	if !exists {
		requests = []time.Time{}
	}
	
	// Remove old requests outside the window
	var validRequests []time.Time
	for _, reqTime := range requests {
		if reqTime.After(cutoff) {
			validRequests = append(validRequests, reqTime)
		}
	}
	
	// Check if we're under the limit
	if len(validRequests) >= rl.limit {
		return false
	}
	
	// Add current request
	validRequests = append(validRequests, now)
	rl.requests[key] = validRequests
	
	return true
}

// GetRemainingRequests returns the number of remaining requests
func (rl *RateLimiter) GetRemainingRequests(key string) int {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()
	
	now := time.Now()
	cutoff := now.Add(-rl.window)
	
	requests, exists := rl.requests[key]
	if !exists {
		return rl.limit
	}
	
	// Count valid requests
	validCount := 0
	for _, reqTime := range requests {
		if reqTime.After(cutoff) {
			validCount++
		}
	}
	
	remaining := rl.limit - validCount
	if remaining < 0 {
		return 0
	}
	
	return remaining
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter *RateLimiter, keyFunc func(*http.Request) string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			key := keyFunc(r)
			
			if !limiter.IsAllowed(key) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limiter.limit))
				w.Header().Set("X-RateLimit-Remaining", "0")
				w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(limiter.window).Unix()))
				w.WriteHeader(http.StatusTooManyRequests)
				
				response := map[string]interface{}{
					"success": false,
					"error":   "Rate limit exceeded",
					"code":    http.StatusTooManyRequests,
				}
				
				json.NewEncoder(w).Encode(response)
				return
			}
			
			// Add rate limit headers
			remaining := limiter.GetRemainingRequests(key)
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limiter.limit))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			w.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(limiter.window).Unix()))
			
			next.ServeHTTP(w, r)
		}
	}
}

// IPBasedRateLimit creates a rate limiter based on IP address
func IPBasedRateLimit(limit int, window time.Duration) func(http.HandlerFunc) http.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	
	return RateLimitMiddleware(limiter, func(r *http.Request) string {
		// Use IP address as the key
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}
		if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
			ip = realIP
		}
		return ip
	})
}

// LoginRateLimit creates a rate limiter specifically for login attempts
func LoginRateLimit() func(http.HandlerFunc) http.HandlerFunc {
	// 5 attempts per 15 minutes per IP
	return IPBasedRateLimit(5, 15*time.Minute)
}

// GeneralRateLimit creates a general rate limiter for API endpoints
func GeneralRateLimit() func(http.HandlerFunc) http.HandlerFunc {
	// 100 requests per minute per IP
	return IPBasedRateLimit(100, time.Minute)
}
