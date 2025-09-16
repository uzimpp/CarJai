// Admin authentication utilities and API functions
import { config } from "@/config/env";
import {
  AdminUser,
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminLoginRequest,
} from "@/constants/admin";

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
    credentials: "include", // Include cookies
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

// Admin authentication API functions
export const adminAuthAPI = {
  // Log in an admin
  async login(data: AdminLoginRequest): Promise<AdminAuthResponse> {
    return apiCall<AdminAuthResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Log out an admin
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiCall("/admin/auth/logout", {
      method: "POST",
    });
  },

  // Get current admin
  async getCurrentAdmin(): Promise<AdminMeResponse> {
    return apiCall<AdminMeResponse>("/admin/auth/me", {
      method: "GET",
    });
  },

  // Get IP whitelist
  async getIPWhitelist(): Promise<AdminIPWhitelistResponse> {
    return apiCall<AdminIPWhitelistResponse>("/admin/ip-whitelist", {
      method: "GET",
    });
  },
};

// Local storage helpers for admin authentication
export const adminAuthStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("adminToken");
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("adminToken", token);
  },

  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("adminToken");
  },

  getAdmin(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const adminStr = localStorage.getItem("adminUser");
    return adminStr ? JSON.parse(adminStr) : null;
  },

  setAdmin(admin: AdminUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("adminUser", JSON.stringify(admin));
  },

  removeAdmin(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("adminUser");
  },

  clear(): void {
    this.removeToken();
    this.removeAdmin();
  },
};
