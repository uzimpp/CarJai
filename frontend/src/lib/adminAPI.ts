// Admin API functions
import {
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminSigninRequest,
  AdminActionResponse,
  MarketPrice,
  MarketPriceResponse,
  ImportMarketPriceResponse,
  DashboardStats,
  ChartDataPoint,
  BrandDataPoint,
  RecentReport,
  AdminAdminsListResponse,
  AdminAdminsListData,
  AdminUser,
  AdminManagedUser,
  AdminManagedCar,
  AdminUpdateUserRequest,
  AdminCreateUserRequest,
  AdminUpdateCarRequest,
  AdminCreateCarRequest,
} from "@/types/admin";
import { apiCall } from "@/lib/apiCall";
import {
AdminReport,
  AdminReportsListResponse,
  ReportType,
  ReportStatus,
} from "@/types/report";

// Get admin API base prefix from environment variable
const adminPrefix = process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX || "/api/admin";

// Admin API functions
export const adminAPI = {
  // Log in an admin
  async signin(data: AdminSigninRequest): Promise<AdminAuthResponse> {
    return apiCall<AdminAuthResponse>(`${adminPrefix}/auth/signin`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Sign out an admin
  async signout(): Promise<{ success: boolean; message: string }> {
    return apiCall(`${adminPrefix}/auth/signout`, {
      method: "POST",
    });
  },

  // Get current admin
  async getCurrentAdmin(): Promise<AdminMeResponse> {
    return apiCall<AdminMeResponse>(`${adminPrefix}/auth/me`, {
      method: "GET",
    });
  },

  // Get IP whitelist
  async getIPWhitelist(): Promise<AdminIPWhitelistResponse> {
    return apiCall<AdminIPWhitelistResponse>(`${adminPrefix}/ip-whitelist`, {
      method: "GET",
    });
  },

  // Add IP to whitelist
  async addIP(
    ip_address: string,
    description: string
  ): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/ip-whitelist/add`, {
      method: "POST",
      body: JSON.stringify({ ip_address, description }),
    });
  },

  // Check if deleting an IP would affect the current session
  async checkIPDeletionImpact(
    ip_address: string
  ): Promise<AdminIPWhitelistResponse> {
    const qs = `?ip=${encodeURIComponent(ip_address)}`;
    return apiCall<AdminIPWhitelistResponse>(
      `${adminPrefix}/ip-whitelist/check${qs}`,
      {
        method: "GET",
      }
    );
  },

  // Remove IP from whitelist (backend expects DELETE with ?ip= query)
  async removeIP(ip_address: string): Promise<AdminActionResponse> {
    const qs = `?ip=${encodeURIComponent(ip_address)}`;
    return apiCall<AdminActionResponse>(
      `${adminPrefix}/ip-whitelist/remove${qs}`,
      {
        method: "DELETE",
      }
    );
  },

  async getMarketPrices(): Promise<MarketPrice[]> {
    const data = await apiCall<MarketPrice[]>(
      `${adminPrefix}/market-price/data`,
      {
        method: "GET",
      }
    );
    // Ensure we return an array
    return Array.isArray(data) ? data : [];
  },

  async importMarketPrices(file: File): Promise<ImportMarketPriceResponse> {
    const form = new FormData();
    form.append("marketPricePdf", file);
    return apiCall<ImportMarketPriceResponse>(
      `${adminPrefix}/market-price/upload`,
      {
        method: "POST",
        body: form,
      }
    );
  },

  // Ban a user
  async banUser(userId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/users/${userId}/ban`, {
      method: "POST",
    });
  },

  // Remove a car listing
  async removeCar(carId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/cars/${carId}/remove`, {
      method: "POST",
    });
  },

  // --- Dashboard API ---
  async getDashboardStats(): Promise<DashboardStats> {
    return apiCall<DashboardStats>(`${adminPrefix}/dashboard/stats`, {
      method: "GET",
    });
  },

  async getChartData(period: string = "30d"): Promise<ChartDataPoint[]> {
    const response = await apiCall<{
      success: boolean;
      code: number;
      data: ChartDataPoint[] | null;
    }>(`${adminPrefix}/dashboard/chart?period=${period}`, {
      method: "GET",
    });
    // Ensure we return an array, defaulting to empty array if data is null or undefined
    return Array.isArray(response?.data) ? response.data : [];
  },

  async getTopBrands(): Promise<BrandDataPoint[]> {
    const response = await apiCall<{
      success: boolean;
      code: number;
      data: BrandDataPoint[] | null;
    }>(`${adminPrefix}/dashboard/top-brands`, {
      method: "GET",
    });
    // Ensure we return an array, defaulting to empty array if data is null or undefined
    return Array.isArray(response?.data) ? response.data : [];
  },

  async getRecentReports(): Promise<RecentReport[]> {
    const response = await apiCall<{
      success: boolean;
      code: number;
      data: RecentReport[] | null;
    }>(`${adminPrefix}/dashboard/recent-reports`, {
      method: "GET",
    });
    // Ensure we return an array, defaulting to empty array if data is null or undefined
    return Array.isArray(response?.data) ? response.data : [];
  },

  // --- Admin Management API ---
  async getAdmins(): Promise<AdminAdminsListData> {
    const response = await apiCall<AdminAdminsListResponse>(
      `${adminPrefix}/admins`,
      {
        method: "GET",
      }
    );
    // Extract data from response, defaulting to empty array if data is null or undefined
    return {
      admins: Array.isArray(response?.data?.admins) ? response.data.admins : [],
      total: response?.data?.total ?? 0,
    };
  },

  async createAdmin(data: {
    username: string;
    name: string;
    password: string;
  }): Promise<AdminUser> {
    return apiCall<AdminUser>(`${adminPrefix}/admins`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateAdmin(
    adminId: number,
    data: { name: string; username: string }
  ): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/admins/${adminId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteAdmin(adminId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/admins/${adminId}`, {
      method: "DELETE",
    });
  },

  // --- User Management API ---
  async getUsers(): Promise<{ users: AdminManagedUser[]; total: number }> {
    const response = await apiCall<{
      success: boolean;
      data: { users?: AdminManagedUser[]; total?: number } | AdminManagedUser[];
    }>(`${adminPrefix}/users`, {
      method: "GET",
    });

    // Handle different response formats
    if (Array.isArray(response?.data)) {
      return {
        users: response.data,
        total: response.data.length,
      };
    } else if (response?.data && "users" in response.data) {
      return {
        users: Array.isArray(response.data.users) ? response.data.users : [],
        total: response.data.total ?? 0,
      };
    }
    return { users: [], total: 0 };
  },

  async createUser(data: AdminCreateUserRequest): Promise<AdminManagedUser> {
    const response = await apiCall<{
      id: number;
      name: string;
      username: string;
      email: string;
      created_at: string;
      updated_at: string;
    }>(`${adminPrefix}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return {
      id: response.id,
      name: response.name,
      username: response.username,
      email: response.email,
      created_at: response.created_at,
      updated_at: response.updated_at,
      type: "user",
      role: "No role",
      roles: {
        buyer: false,
        seller: false,
      },
    };
  },

  async updateUser(
    userId: number,
    data: AdminUpdateUserRequest
  ): Promise<AdminManagedUser> {
    const response = await apiCall<{
      id: number;
      name: string;
      username: string;
      email: string | null;
      created_at: string;
      updated_at?: string;
    }>(`${adminPrefix}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    return {
      id: response.id,
      name: response.name,
      username: response.username,
      email: response.email,
      created_at: response.created_at,
      updated_at: response.updated_at,
      type: "user",
      role: "No role",
      roles: {
        buyer: false,
        seller: false,
      },
    };
  },

  async deleteUser(userId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/users/${userId}`, {
      method: "DELETE",
    });
  },

  // --- Car Management API ---
  async getCars(): Promise<{ cars: AdminManagedCar[]; total: number }> {
    const response = await apiCall<{
      success: boolean;
      data: { cars?: AdminManagedCar[]; total?: number } | AdminManagedCar[];
    }>(`${adminPrefix}/cars`, {
      method: "GET",
    });

    // Handle different response formats
    if (Array.isArray(response?.data)) {
      return {
        cars: response.data,
        total: response.data.length,
      };
    } else if (response?.data && "cars" in response.data) {
      return {
        cars: Array.isArray(response.data.cars) ? response.data.cars : [],
        total: response.data.total ?? 0,
      };
    }
    return { cars: [], total: 0 };
  },

  async createCar(data: AdminCreateCarRequest): Promise<AdminManagedCar> {
    const response = await apiCall<{
      id: number;
      brandName: string | null;
      modelName: string | null;
      submodelName: string | null;
      year: number | null;
      price: number | null;
      mileage: number | null;
      status: string;
      createdAt: string;
      sellerId: number;
    }>(`${adminPrefix}/cars`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return {
      id: response.id,
      brandName: response.brandName,
      modelName: response.modelName,
      submodelName: response.submodelName,
      year: response.year,
      price: response.price,
      mileage: response.mileage,
      status: response.status,
      listedDate: response.createdAt,
      soldBy: `User ID: ${response.sellerId}`,
    };
  },

  async updateCar(
    carId: number,
    data: AdminUpdateCarRequest
  ): Promise<AdminManagedCar> {
    const response = await apiCall<{
      id: number;
      brandName: string | null;
      modelName: string | null;
      submodelName: string | null;
      year: number | null;
      price: number | null;
      mileage: number | null;
      status: string;
      createdAt: string;
    }>(`${adminPrefix}/cars/${carId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    // Note: We might not have all fields from update, so merge with existing
    return {
      id: response.id,
      brandName: response.brandName,
      modelName: response.modelName,
      submodelName: response.submodelName,
      year: response.year,
      price: response.price,
      mileage: response.mileage,
      status: response.status,
      listedDate: response.createdAt,
      soldBy: null, // Update response doesn't include seller info
    };
  },

  async deleteCar(carId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`${adminPrefix}/cars/${carId}`, {
      method: "DELETE",
    });
  },

  // Admin API functions
  async listReports(params?: {
    type?: ReportType;
    status?: ReportStatus;
  }): Promise<AdminReportsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.status) searchParams.append("status", params.status);

    const queryString = searchParams.toString();
    return apiCall<AdminReportsListResponse>(
      `/admin/reports${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      }
    );
  },

  async resolveReport(reportId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`/admin/reports/${reportId}/resolve`, {
      method: "POST",
    });
  },

  async dismissReport(reportId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`/admin/reports/${reportId}/dismiss`, {
      method: "POST",
    });
  },
};
