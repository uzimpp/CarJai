package utils

import (
	"testing"
)

func TestValidateIPAddress(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid IPv4",
			ip:      "192.168.1.1",
			wantErr: false,
		},
		{
			name:    "valid IPv6",
			ip:      "2001:db8::1",
			wantErr: false,
		},
		{
			name:    "valid CIDR IPv4",
			ip:      "192.168.1.0/24",
			wantErr: false,
		},
		{
			name:    "valid CIDR IPv6",
			ip:      "2001:db8::/32",
			wantErr: false,
		},
		{
			name:    "invalid IP",
			ip:      "999.999.999.999",
			wantErr: true,
		},
		{
			name:    "invalid CIDR",
			ip:      "192.168.1.0/99",
			wantErr: true,
		},
		{
			name:    "empty IP",
			ip:      "",
			wantErr: true,
		},
		{
			name:    "localhost IPv4",
			ip:      "127.0.0.1",
			wantErr: false,
		},
		{
			name:    "localhost IPv6",
			ip:      "::1",
			wantErr: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateIPAddress(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateIPAddress() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestIsIPInRange(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		cidr    string
		want    bool
		wantErr bool
	}{
		{
			name:    "IP in range",
			ip:      "192.168.1.100",
			cidr:    "192.168.1.0/24",
			want:    true,
			wantErr: false,
		},
		{
			name:    "IP not in range",
			ip:      "192.168.2.100",
			cidr:    "192.168.1.0/24",
			want:    false,
			wantErr: false,
		},
		{
			name:    "exact match",
			ip:      "192.168.1.1",
			cidr:    "192.168.1.1/32",
			want:    true,
			wantErr: false,
		},
		{
			name:    "invalid IP",
			ip:      "999.999.999.999",
			cidr:    "192.168.1.0/24",
			want:    false,
			wantErr: true,
		},
		{
			name:    "invalid CIDR",
			ip:      "192.168.1.100",
			cidr:    "192.168.1.0/99",
			want:    false,
			wantErr: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := IsIPInRange(tt.ip, tt.cidr)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsIPInRange() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("IsIPInRange() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsIPWhitelisted(t *testing.T) {
	tests := []struct {
		name      string
		clientIP  string
		whitelist []string
		want      bool
		wantErr   bool
	}{
		{
			name:      "IP in whitelist",
			clientIP:  "192.168.1.100",
			whitelist: []string{"192.168.1.0/24", "10.0.0.0/8"},
			want:      true,
			wantErr:   false,
		},
		{
			name:      "IP not in whitelist",
			clientIP:  "192.168.2.100",
			whitelist: []string{"192.168.1.0/24", "10.0.0.0/8"},
			want:      false,
			wantErr:   false,
		},
		{
			name:      "exact IP match",
			clientIP:  "192.168.1.1",
			whitelist: []string{"192.168.1.1", "10.0.0.0/8"},
			want:      true,
			wantErr:   false,
		},
		{
			name:      "empty whitelist",
			clientIP:  "192.168.1.100",
			whitelist: []string{},
			want:      false,
			wantErr:   true,
		},
		{
			name:      "localhost IPv4",
			clientIP:  "127.0.0.1",
			whitelist: []string{"127.0.0.1/32"},
			want:      true,
			wantErr:   false,
		},
		{
			name:      "localhost IPv6",
			clientIP:  "::1",
			whitelist: []string{"::1/128"},
			want:      true,
			wantErr:   false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := IsIPWhitelisted(tt.clientIP, tt.whitelist)
			if (err != nil) != tt.wantErr {
				t.Errorf("IsIPWhitelisted() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("IsIPWhitelisted() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestExtractClientIP(t *testing.T) {
	tests := []struct {
		name           string
		remoteAddr     string
		xForwardedFor  string
		xRealIP        string
		want           string
	}{
		{
			name:       "X-Real-IP priority",
			remoteAddr: "192.168.1.100:8080",
			xForwardedFor: "10.0.0.1, 192.168.1.50",
			xRealIP:    "203.0.113.1",
			want:       "203.0.113.1",
		},
		{
			name:       "X-Forwarded-For first IP",
			remoteAddr: "192.168.1.100:8080",
			xForwardedFor: "203.0.113.1, 192.168.1.50",
			xRealIP:    "",
			want:       "203.0.113.1",
		},
		{
			name:       "RemoteAddr fallback",
			remoteAddr: "192.168.1.100:8080",
			xForwardedFor: "",
			xRealIP:    "",
			want:       "192.168.1.100",
		},
		{
			name:       "empty headers",
			remoteAddr: "",
			xForwardedFor: "",
			xRealIP:    "",
			want:       "",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractClientIP(tt.remoteAddr, tt.xForwardedFor, tt.xRealIP)
			if got != tt.want {
				t.Errorf("ExtractClientIP() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNormalizeIPAddress(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		want    string
		wantErr bool
	}{
		{
			name:    "IPv4 address",
			ip:      "192.168.1.1",
			want:    "192.168.1.1",
			wantErr: false,
		},
		{
			name:    "IPv6 address",
			ip:      "2001:db8::1",
			want:    "2001:db8::1",
			wantErr: false,
		},
		{
			name:    "IPv4-mapped IPv6",
			ip:      "::ffff:192.168.1.1",
			want:    "192.168.1.1",
			wantErr: false,
		},
		{
			name:    "invalid IP",
			ip:      "999.999.999.999",
			want:    "",
			wantErr: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NormalizeIPAddress(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("NormalizeIPAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("NormalizeIPAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}
