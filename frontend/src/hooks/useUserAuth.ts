"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, LoginRequest, SignupRequest } from "@/constants/user";
import { authAPI, authStorage, mutualLogout } from "@/lib/auth";

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

interface AuthErrorWithField {
  message: string;
  field?: string;
}

export function useUserAuth(): AuthState &
  AuthActions & { error: AuthErrorWithField | null } {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = useState<AuthErrorWithField | null>(null);

  // Initialize auth state from localStorage and cookies
  useEffect(() => {
    const token = authStorage.getToken();
    const user = authStorage.getUser();

    console.log("🔍 Auth initialization - Token:", token, "User:", user);

    if (token && user) {
      console.log("✅ Found auth data, setting authenticated state");
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      console.log("❌ No auth data found, setting unauthenticated state");
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
      console.log("🚀 Login function called with:", data);
      try {
        setError(null);
        setState((prev) => ({ ...prev, isLoading: true }));

        console.log("📡 Calling authAPI.login...");
        const response = await authAPI.login(data);
        console.log("✅ Login response received:", response);

        // Clear any existing admin session (mutual logout)
        await mutualLogout.clearAdminSession();

        // Store user data (token is handled by backend via cookie)
        authStorage.setUser(response.data.user);
        console.log("💾 User stored in localStorage");

        setState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });
        console.log("🔄 State updated - isAuthenticated: true");

        // Redirect to buy page after successful login
        console.log("🔀 Redirecting to /buy...");
        router.push("/buy");
        console.log("✨ Redirect called");
      } catch (err) {
        console.error("❌ Login error:", err);
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

        // Clear any existing admin session (mutual logout)
        await mutualLogout.clearAdminSession();

        // Store user data (token is handled by backend via cookie)
        authStorage.setUser(response.data.user);

        setState({
          user: response.data.user,
          token: response.data.token,
          isLoading: false,
          isAuthenticated: true,
        });

        // Redirect to buy page after successful signup
        router.push("/buy");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Signup failed";

        // If user already exists, redirect to login page with message
        if (errorMessage.includes("already exists")) {
          router.push("/login?message=account_exists");
          return;
        }

        setError({
          message: errorMessage,
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
      await authAPI.logout(); // No need to pass token, backend reads from cookie
    } catch (err) {
      // Even if logout fails on server, clear local state
      console.warn("User logout API call failed:", err);
    } finally {
      // Clear local storage and state
      authStorage.clear();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      setError(null); // Clear any existing errors

      // Redirect to home page
      router.push("/");
    }
  }, [router]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await authAPI.refreshToken(); // No need to pass token

      // Update stored user data (token is handled by backend via cookie)
      authStorage.setUser(response.data.user);

      setState((prev) => ({
        ...prev,
        token: response.data.token, // Keep for compatibility
        user: response.data.user,
      }));
    } catch (err) {
      // If refresh fails, logout user
      console.warn("Token refresh failed:", err);
      await logout();
    }
  }, [logout]);

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
