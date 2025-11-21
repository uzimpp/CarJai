interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
  last_login_at: string | null;
  created_at: string;
}

interface AdminSession {
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

interface AdminIPWhitelist {
  id: number;
  admin_id: number;
  ip_address: string;
  description: string;
  created_at: string;
}

interface AdminMeResponse {
  success: boolean;
  data: {
    admin: AdminUser;
    session: AdminSession;
  };
}

interface AdminIPWhitelistResponse {
  success: boolean;
  data?: AdminIPWhitelist[] | { wouldBlockSession: boolean };
  message?: string;
  would_block_session?: boolean; // Warning: deletion would affect current session (deprecated, use data.wouldBlockSession)
}

interface AdminAuthResponse {
  success: boolean;
  data: {
    admin: AdminUser;
    token: string;
    expires_at: string;
  };
  message?: string;
}

interface AdminAuthError {
  success: false;
  error: string;
  code: number;
}

interface AdminActionResponse {
  success: boolean;
  message: string;
}

interface AdminSigninRequest {
  username: string;
  password: string;
}

type UserType = "admin" | "user";
type UserRole = "Admin" | "Buyer" | "Seller" | "No role";

interface AdminManagedUser {
  id: number;
  type: UserType;
  // User-only fields (users have email, updated_at, created_at)
  email?: string | null; // Only for users
  updated_at?: string; // Only for users - when profile was last updated
  // Common fields (both admins and users have these)
  username: string;
  name: string;
  created_at: string;
  // UI fields (derived from data, not in database)
  role: UserRole;
  roles?: {
    buyer: boolean;
    seller: boolean;
  };
}

interface AdminUpdateUserRequest {
  name?: string;
  username?: string;
  email?: string; // Only for users
}

interface AdminUpdateUserResponse {
  success: boolean;
  message: string;
}

interface AdminCreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface AdminUpdateUserError {
  success: false;
  error: string;
  code: number;
}

interface AdminManagedCar {
  id: number;
  brandName: string | null;
  modelName: string | null;
  submodelName: string | null;
  year: number | null;
  status: string;
  listedDate: string;
  soldBy: string | null;
  price: number | null;
  mileage: number | null;
}

interface AdminUpdateCarRequest {
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  year?: number;
  price?: number;
  mileage?: number;
  status?: string;
}

interface AdminCreateCarRequest {
  sellerId: number;
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  year?: number;
  price?: number;
  mileage?: number;
  status?: string;
}

// Backend returns: {success: true, data: {admins: AdminUser[], total: number}}
interface AdminAdminsListData {
  admins: AdminUser[];
  total: number;
}
interface AdminAdminsListResponse {
  success: boolean;
  data: AdminAdminsListData;
  message?: string;
}
interface MarketPrice {
  id: number;
  brand: string;
  model: string;
  sub_model: string;
  year_start: number;
  year_end: number;
  price_min_thb: number;
  price_max_thb: number;
}

interface MarketPriceResponse {
  success: boolean;
  data: MarketPrice[];
  message: string;
}

// Import (PDF) response from backend
interface ImportMarketPriceResponse {
  success: boolean;
  code: number;
  data: {
    inserted_count: number;
    updated_count: number;
  };
  message?: string;
}

interface DashboardStats {
  totalUsers: number;
  activeCars: number;
  soldCars: number;
  pendingReports: number;
  totalBuyers: number;
  totalSellers: number;
}

interface RecentReport {
  id: number;
  reportType: "seller" | "car";
  carId: number | null;
  sellerId: number | null;
  description: string;
  reporterId: number;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface BrandDataPoint {
  brand: string;
  count: number;
}

export type {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminAuthError,
  AdminSigninRequest,
  AdminActionResponse,
  AdminManagedUser,
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminUpdateUserError,
  AdminCreateUserRequest,
  AdminManagedCar,
  AdminUpdateCarRequest,
  AdminCreateCarRequest,
  AdminAdminsListResponse,
  AdminAdminsListData,
  UserType,
  UserRole,
  MarketPrice,
  MarketPriceResponse,
  ImportMarketPriceResponse,
  DashboardStats,
  RecentReport,
  ChartDataPoint,
  BrandDataPoint,
};
