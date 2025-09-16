// Authentication utilities and API functions
import { config } from "@/config/env";
import {
  User,
  AuthResponse,
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
    credentials: "include", // Include cookies in requests
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
};

// Local storage helpers
export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return this.getCookie("jwt");
  },

  setToken(): void {
    if (typeof window === "undefined") return;
    // Token is set by backend via Set-Cookie header
    // We don't need to set it manually
  },

  removeToken(): void {
    if (typeof window === "undefined") return;
    // Token is cleared by backend via Set-Cookie header
    // We don't need to clear it manually
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

  // Helper to get cookie value
  getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
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

// Mutual logout utility to clear both user and admin sessions
export const mutualLogout = {
  async clearAdminSession(): Promise<void> {
    try {
      // Check if admin session exists before attempting to clear
      const adminToken = localStorage.getItem("adminToken");
      const adminUser = localStorage.getItem("adminUser");

      if (adminToken || adminUser) {
        await fetch(`${config.apiUrl}/admin/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        console.log("🧹 Cleared admin session");
      } else {
        console.log("ℹ️ No admin session to clear");
      }
    } catch (err) {
      console.log("ℹ️ Error clearing admin session:", err);
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      // Check if user session exists before attempting to clear
      const userToken = authStorage.getToken();
      const user = authStorage.getUser();

      if (userToken || user) {
        await fetch(`${config.apiUrl}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        console.log("🧹 Cleared user session");
      } else {
        console.log("ℹ️ No user session to clear");
      }
    } catch (err) {
      console.log("ℹ️ Error clearing user session:", err);
    }
  },
};
