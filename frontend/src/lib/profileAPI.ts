import {
  ProfileResponse,
  BuyerRequest,
  SellerRequest,
  SellerResponse,
} from "@/types/user";
import { apiCall } from "@/lib/apiCall";

// Request type for unified profile update (account, buyer, and/or seller)
export interface UpdateSelfRequest {
  username?: string;
  name?: string;
  buyer?: BuyerRequest;
  seller?: SellerRequest;
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

  // Unified profile update (account fields, buyer, and/or seller profiles)
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

  // Get seller profile data (public endpoint for displaying seller profile)
  async getSellerProfile(id: string | number): Promise<SellerResponse> {
    return apiCall(`/api/profile/seller/${id}`, {
      method: "GET",
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
