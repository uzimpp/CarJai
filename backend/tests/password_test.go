package tests

import (
	"testing"

	"github.com/uzimpp/CarJai/backend/utils"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "valid password",
			password: "testpassword123",
			wantErr:  false,
		},
		{
			name:     "empty password",
			password: "",
			wantErr:  false,
		},
		{
			name:     "long password",
			password: "verylongpasswordthatshouldworkfine123456789",
			wantErr:  false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := utils.HashPassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("utils.HashPassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			
			if !tt.wantErr && hash == "" {
				t.Error("utils.HashPassword() returned empty hash")
			}
		})
	}
}

func TestVerifyPassword(t *testing.T) {
	password := "testpassword123"
	hash, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("utils.HashPassword() failed: %v", err)
	}
	
	tests := []struct {
		name     string
		password string
		hash     string
		want     bool
	}{
		{
			name:     "correct password",
			password: password,
			hash:     hash,
			want:     true,
		},
		{
			name:     "wrong password",
			password: "wrongpassword",
			hash:     hash,
			want:     false,
		},
		{
			name:     "empty password",
			password: "",
			hash:     hash,
			want:     false,
		},
		{
			name:     "invalid hash",
			password: password,
			hash:     "invalidhash",
			want:     false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := utils.VerifyPassword(tt.password, tt.hash); got != tt.want {
				t.Errorf("utils.VerifyPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "valid password",
			password: "testpassword123",
			wantErr:  false,
		},
		{
			name:     "too short password",
			password: "12345",
			wantErr:  true,
		},
		{
			name:     "too long password",
			password: "verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789verylongpasswordthatshouldworkfine123456789",
			wantErr:  true,
		},
		{
			name:     "minimum length password",
			password: "123456",
			wantErr:  false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := utils.ValidatePasswordStrength(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("utils.ValidatePasswordStrength() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
