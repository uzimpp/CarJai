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

  const validateSession = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        setState({
          user: response.data.user,
          token: "cookie-based",
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }
      throw new Error("Invalid session");
    } catch {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    if (!state.isLoading) {
      validateSession();
    }
  }, [pathname, validateSession, state.isLoading]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      setError(null);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await authAPI.login(data);
        await mutualLogout.clearAdminSession();

        setState({
          user: response.data.user,
          token: "cookie-based",
          isLoading: false,
          isAuthenticated: true,
        });

        router.push("/buy");
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

  const signup = useCallback(
    async (data: SignupRequest) => {
      setError(null);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await authAPI.signup(data);
        await mutualLogout.clearAdminSession();

        setState({
          user: response.data.user,
          token: "cookie-based",
          isLoading: false,
          isAuthenticated: true,
        });

        router.push("/buy");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Signup failed";

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

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      setError(null);
      router.push("/");
    }
  }, [router]);

  return {
    ...state,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}

