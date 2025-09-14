interface AdminUser {
  id: number;
  username: string;
  name: string;
  last_login_at: string;
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

export type {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminMeResponse,
  AdminIPWhitelistResponse,
};
