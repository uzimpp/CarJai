interface User {
  id: number;
  email: string;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
  message?: string;
}

interface AuthError {
  success: false;
  error: string;
  code: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
}

export type { User, AuthResponse, AuthError, LoginRequest, SignupRequest };
