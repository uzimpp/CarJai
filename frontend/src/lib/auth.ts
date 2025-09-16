// Authentication utilities and API functions
import { config } from "@/config/env";
import {
  User,
  AuthResponse,
  AuthError,
  LoginRequest,
  SignupRequest,
} from "@/constants/user";

// API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.apiUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

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
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    return apiCall("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get current user
  async getCurrentUser(
    token: string
  ): Promise<{ success: boolean; data: { user: User } }> {
    return apiCall("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Refresh token
  async refreshToken(token: string): Promise<AuthResponse> {
    return apiCall<AuthResponse>("/api/auth/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Local storage helpers
export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("userToken");
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("userToken", token);
  },

  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("userToken");
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("user", JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("user");
  },

  clear(): void {
    this.removeToken();
    this.removeUser();
  },
};

// Validation helpers
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= 6;
  },
};
