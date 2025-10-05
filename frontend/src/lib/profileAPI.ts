// Profile API functions and validation helpers
import {
  ProfileResponse,
  BuyerRequest,
  BuyerResponse,
  SellerRequest,
  SellerResponse,
} from "@/constants/user";
import { apiCall } from "./apiCall";

// Request type for updating user account fields
export interface UpdateSelfRequest {
  username?: string;
  name?: string;
}

// Request type for changing password
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Response type for password change
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// Profile API functions
export const profileAPI = {
  // Get full profile aggregate
  async getProfile(): Promise<ProfileResponse> {
    return apiCall("/api/profile/self", {
      method: "GET",
    });
  },

  // Update account fields (username, name)
  async updateSelf(data: UpdateSelfRequest): Promise<ProfileResponse> {
    return apiCall("/api/profile/self", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Change password
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    return apiCall("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get buyer profile data
  async getBuyerProfile(): Promise<BuyerResponse> {
    return apiCall("/api/profile/buyer", {
      method: "GET",
    });
  },

  // Upsert buyer profile data
  async upsertBuyerProfile(data: BuyerRequest): Promise<BuyerResponse> {
    return apiCall("/api/profile/buyer", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Get seller profile data
  async getSellerProfile(): Promise<SellerResponse> {
    return apiCall("/api/profile/seller", {
      method: "GET",
    });
  },

  // Upsert seller profile data
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
