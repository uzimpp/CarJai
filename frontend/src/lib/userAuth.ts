import {
  AuthResponse,
  SigninRequest,
  SignupRequest,
  GoogleAuthRequest,
  GoogleAuthResponse,
  MeResponse,
} from "@/types/user";
import { apiCall } from "@/lib/apiCall";

// Authentication API functions
export const authAPI = {
  // Sign up a new user
  async signup(data: SignupRequest): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Log in a user
  async signin(data: SigninRequest): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Sign out a user
  async signout(): Promise<{ success: boolean; message: string }> {
    return apiCall("/api/auth/signout", {
      method: "POST",
    });
  },

  async clearUserSession(): Promise<void> {
    return apiCall("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });
  },

  // Get current user with roles and profiles
  async getCurrentUser(): Promise<MeResponse> {
    return apiCall("/api/auth/me", {
      method: "GET",
    });
  },

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/api/auth/refresh", {
      method: "POST",
    });
  },

  // Google OAuth authentication
  async googleAuth(data: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    // Use backend endpoint that verifies Google ID token server-side
    return apiCall<GoogleAuthResponse>("/api/auth/google/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Forgot password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return apiCall<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiCall<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    });
  },
};
