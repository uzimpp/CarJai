// Authentication utilities and API functions
import {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  GoogleAuthRequest,
  GoogleAuthResponse,
  MeResponse,
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
    return apiCall<GoogleAuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
