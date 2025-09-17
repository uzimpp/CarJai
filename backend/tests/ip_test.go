package tests

import (
	"testing"

	"github.com/uzimpp/CarJai/backend/utils"
)

func TestValidateIPAddress(t *testing.T) {
	tests := []struct {
		name    string
		ip      string
		wantErr bool
	}{
		{
			name:    "valid IPv6",
			ip:      "2001:db8::1",
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
			err := utils.ValidateIPAddress(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("utils.ValidateIPAddress() error = %v, wantErr %v", err, tt.wantErr)
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
			name:      "exact IP match",
			clientIP:  "10.0.0.1",
			whitelist: []string{"10.0.0.1", "10.0.0.0/8"},
			want:      true,
			wantErr:   false,
		},
		{
			name:      "empty whitelist",
			clientIP:  "10.0.0.100",
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
			got, err := utils.IsIPWhitelisted(tt.clientIP, tt.whitelist)
			if (err != nil) != tt.wantErr {
				t.Errorf("utils.IsIPWhitelisted() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("utils.IsIPWhitelisted() = %v, want %v", got, tt.want)
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
			remoteAddr: "10.0.0.100:8080",
			xForwardedFor: "10.0.0.1, 10.0.0.50",
			xRealIP:    "203.0.113.1",
			want:       "203.0.113.1",
		},
		{
			name:       "X-Forwarded-For first IP",
			remoteAddr: "10.0.0.100:8080",
			xForwardedFor: "203.0.113.1, 10.0.0.50",
			xRealIP:    "",
			want:       "203.0.113.1",
		},
		{
			name:       "RemoteAddr fallback",
			remoteAddr: "10.0.0.100:8080",
			xForwardedFor: "",
			xRealIP:    "",
			want:       "10.0.0.100",
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
			got := utils.ExtractClientIP(tt.remoteAddr, tt.xForwardedFor, tt.xRealIP)
			if got != tt.want {
				t.Errorf("utils.ExtractClientIP() = %v, want %v", got, tt.want)
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
			ip:      "10.0.0.1",
			want:    "10.0.0.1",
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
			ip:      "::ffff:10.0.0.1",
			want:    "10.0.0.1",
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
			got, err := utils.NormalizeIPAddress(tt.ip)
			if (err != nil) != tt.wantErr {
				t.Errorf("utils.NormalizeIPAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("utils.NormalizeIPAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}
