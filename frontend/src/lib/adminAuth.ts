// Admin authentication utilities and API functions
import {
  AdminUser,
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminLoginRequest,
} from "@/constants/admin";
import { apiCall } from "./apiCall";

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

// Pure cookie-based authentication - no localStorage needed!
// All authentication state comes from backend cookies
export const adminAuthStorage = {
  // Cookie-based auth doesn't need client-side token storage
  getToken(): string | null {
    return "cookie-based"; // Placeholder - actual auth via HTTP-only cookies
  },

  setToken(): void {
    // Tokens are set by backend via Set-Cookie header
    // No client-side storage needed
  },

  removeToken(): void {
    // Tokens are cleared by backend via Set-Cookie header
    // No client-side storage needed
  },

  // No localStorage - always fetch fresh from backend
  getAdmin(): AdminUser | null {
    return null; // Always fetch from backend
  },

  setAdmin(): void {
    // No localStorage - UI state managed by React hooks
  },

  removeAdmin(): void {
    // No localStorage - UI state managed by React hooks
  },

  clear(): void {
    // No localStorage to clear - pure cookie-based
  },
};
