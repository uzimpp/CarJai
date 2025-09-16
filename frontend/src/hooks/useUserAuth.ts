"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authAPI, authStorage } from "@/lib/auth";
import { User, LoginRequest, SignupRequest } from "@/constants/user";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

interface AuthError {
  message: string;
  field?: string;
}

export function useUserAuth(): AuthState &
  AuthActions & { error: AuthError | null } {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();

    if (token && user) {
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Login function
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setError(null);
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await authAPI.login(data);

        // Store auth data
        authStorage.setToken(response.data.token);
        authStorage.setUser(response.data.user);

        setState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });

        // Redirect to home page
        router.push("/");
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Login failed",
          field: "general",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [router]
  );

  // Signup function
  const signup = useCallback(
    async (data: SignupRequest) => {
      try {
        setError(null);
        setState((prev) => ({ ...prev, isLoading: true }));

        const response = await authAPI.signup(data);

        // Store auth data
        authStorage.setToken(response.data.token);
        authStorage.setUser(response.data.user);

        setState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });

        // Redirect to home page
        router.push("/");
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Signup failed",
          field: "general",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [router]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (state.token) {
        await authAPI.logout(state.token);
      }
    } catch (err) {
      // Even if logout fails on server, clear local state
      console.warn("Logout API call failed:", err);
    } finally {
      // Clear local storage and state
      authStorage.clear();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      // Redirect to home page
      router.push("/");
    }
  }, [state.token, router]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.token) return;

    try {
      const response = await authAPI.refreshToken(state.token);

      // Update stored token
      authStorage.setToken(response.data.token);
      authStorage.setUser(response.data.user);

      setState((prev) => ({
        ...prev,
        token: response.data.token,
        user: response.data.user,
      }));
    } catch (err) {
      // If refresh fails, logout user
      console.warn("Token refresh failed:", err);
      await logout();
    }
  }, [state.token, logout]);

  return {
    ...state,
    error,
    login,
    signup,
    logout,
    refreshToken,
    clearError,
  };
}

// Export both names for backward compatibility
export const useAuth = useUserAuth;
