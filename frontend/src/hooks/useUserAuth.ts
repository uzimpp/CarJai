"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LoginRequest, SignupRequest } from "@/constants/user";
import { authAPI } from "@/lib/userAuth";
import { mutualLogout } from "@/lib/mutualLogout";

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
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = useState<AuthErrorWithField | null>(null);

  // Validate user session with backend (pure cookie-based)
  const validateUserSession = useCallback(async () => {
    console.log(
      "🔍 Validating user session with backend (pure cookie-based)..."
    );

    try {
      // Pure cookie-based validation - no localStorage involved
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        console.log("✅ User session validated with backend (cookie-based)");

        // Update React state directly - no localStorage storage
        setState({
          user: response.data.user,
          token: "cookie-based",
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }
    } catch (error) {
      console.error("User session validation failed:", error);
    }

    // Validation failed - not authenticated
    console.log("❌ User not authenticated (pure cookie-based)");
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Initialize auth state - validate with backend first (cookie-based)
  useEffect(() => {
    console.log("🔍 User auth initialization - validating with backend...");
    validateUserSession();
  }, [validateUserSession]);

  // Re-validate user state on route changes to refresh navbar
  // Only if not already loading to prevent infinite loops
  useEffect(() => {
    if (!state.isLoading) {
      validateUserSession();
    }
  }, [pathname, validateUserSession, state.isLoading]);

  // No localStorage listeners needed - pure cookie-based authentication
  // Browser will handle cookie changes automatically

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

        // Update React state directly - no localStorage storage
        setState({
          user: response.data.user,
          token: "cookie-based", // Token handled by backend via cookie
          isLoading: false,
          isAuthenticated: true,
        });
        console.log("🔄 State updated - pure cookie-based authentication");

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

        // Update React state directly - no localStorage storage
        setState({
          user: response.data.user,
          token: "cookie-based", // Token handled by backend via cookie
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
      // Clear React state (no localStorage to clear in pure cookie-based)
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

      // Update React state directly - no localStorage storage
      setState((prev) => ({
        ...prev,
        token: "cookie-based", // Token handled by backend via cookie
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
