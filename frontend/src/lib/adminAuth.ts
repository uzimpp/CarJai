// Admin authentication utilities and API functions
import {
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminSigninRequest,
  AdminActionResponse,
  MarketPrice,
  MarketPriceResponse,
  ImportMarketPriceResponse,
} from "@/types/admin";
import { apiCall } from "@/lib/apiCall";

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

  // Check if deleting an IP would affect the current session
  async checkIPDeletionImpact(
    ip_address: string
  ): Promise<AdminIPWhitelistResponse> {
    const qs = `?ip=${encodeURIComponent(ip_address)}`;
    return apiCall<AdminIPWhitelistResponse>(`/admin/ip-whitelist/check${qs}`, {
      method: "GET",
    });
  },

  // Remove IP from whitelist (backend expects DELETE with ?ip= query)
  async removeIP(ip_address: string): Promise<AdminActionResponse> {
    const qs = `?ip=${encodeURIComponent(ip_address)}`;
    return apiCall<AdminActionResponse>(`/admin/ip-whitelist/remove${qs}`, {
      method: "DELETE",
    });
  },

  async getMarketPrices(): Promise<MarketPrice[]> {
    return apiCall<MarketPrice[]>("/admin/market-price/data", {
      method: "GET",
    });
  },

  async importMarketPrices(file: File): Promise<ImportMarketPriceResponse> {
    const form = new FormData();
    form.append("marketPricePdf", file);
    return apiCall<ImportMarketPriceResponse>("/admin/market-price/upload", {
      method: "POST",
      body: form,
    });
  },
};
