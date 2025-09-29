// Authentication utilities and API functions
import {
  User,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  GoogleAuthRequest,
  GoogleAuthResponse,
} from "@/constants/user";
import { apiCall } from "./apiCall";

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
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Log out a user
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiCall("/api/auth/logout", {
      method: "POST",
    });
  },

  // Get current user
  async getCurrentUser(): Promise<{ success: boolean; data: { user: User } }> {
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
    return apiCall<GoogleAuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Validation helpers (kept for forms)
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= 6;
  },
};
