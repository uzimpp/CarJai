// Profile API functions and validation helpers
import {
  ProfileResponse,
  BuyerRequest,
  BuyerResponse,
  SellerRequest,
  SellerResponse,
} from "@/constants/user";
import { apiCall } from "./apiCall";

// Profile API functions
export const profileAPI = {
  // Get full profile
  async getProfile(): Promise<ProfileResponse> {
    return apiCall("/api/profile", {
      method: "GET",
    });
  },

  // Get buyer profile
  async getBuyerProfile(): Promise<BuyerResponse> {
    return apiCall("/api/profile/buyer", {
      method: "GET",
    });
  },

  // Upsert buyer profile
  async upsertBuyerProfile(data: BuyerRequest): Promise<BuyerResponse> {
    return apiCall("/api/profile/buyer", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Get seller profile
  async getSellerProfile(): Promise<SellerResponse> {
    return apiCall("/api/profile/seller", {
      method: "GET",
    });
  },

  // Upsert seller profile
  async upsertSellerProfile(data: SellerRequest): Promise<SellerResponse> {
    return apiCall("/api/profile/seller", {
      method: "PUT",
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
