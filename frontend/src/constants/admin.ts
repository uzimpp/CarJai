interface AdminUser {
  id: number;
  username: string;
  name: string;
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
  data: AdminIPWhitelist[];
  message: string;
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

interface AdminLoginRequest {
  username: string;
  password: string;
}

export type {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminMeResponse,
  AdminIPWhitelistResponse,
  AdminAuthResponse,
  AdminAuthError,
  AdminLoginRequest,
};
