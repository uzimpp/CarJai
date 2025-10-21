// Admin authentication utilities and API functions
import {
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminSigninRequest,
  AdminActionResponse,
} from "@/types/admin";
import { apiCall } from "@/lib/ApiCall";

// Admin authentication API functions
export const adminAuthAPI = {
  // Log in an admin
  async signin(data: AdminSigninRequest): Promise<AdminAuthResponse> {
    return apiCall<AdminAuthResponse>("/admin/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Sign out an admin
  async signout(): Promise<{ success: boolean; message: string }> {
    return apiCall("/admin/auth/signout", {
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

  // Add IP to whitelist
  async addIP(
    ip_address: string,
    description: string
  ): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>("/admin/ip-whitelist/add", {
      method: "POST",
      body: JSON.stringify({ ip_address, description }),
    });
  },

  // Remove IP from whitelist (backend expects DELETE with ?ip= query)
  async removeIP(ip_address: string): Promise<AdminActionResponse> {
    const qs = `?ip=${encodeURIComponent(ip_address)}`;
    return apiCall<AdminActionResponse>(`/admin/ip-whitelist/remove${qs}`, {
      method: "DELETE",
    });
  },
};
