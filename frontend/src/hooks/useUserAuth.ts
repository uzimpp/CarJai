"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  LoginRequest,
  SignupRequest,
  UserRoles,
  UserProfiles,
} from "@/constants/user";
import { authAPI } from "@/lib/userAuth";
import { mutualLogout } from "@/lib/mutualLogout";

interface AuthState {
  user: User | null;
  token: string | null;
  roles: UserRoles | null;
  profiles: UserProfiles | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  signup: (
    data: SignupRequest
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface AuthErrorWithField {
  message: string;
  field?: string;
}

export function useUserAuth(): AuthState &
  AuthActions & { error: AuthErrorWithField | null } {
  const pathname = usePathname();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    roles: null,
    profiles: null,
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
          roles: response.data.roles,
          profiles: response.data.profiles,
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
        roles: null,
        profiles: null,
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
        await authAPI.login(data);
        await mutualLogout.clearAdminSession();

        // After login, fetch the updated user data with roles
        await validateSession();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError({
          message,
          field: "general",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: message };
      }
    },
    [validateSession]
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      setError(null);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await authAPI.signup(data);
        await mutualLogout.clearAdminSession();

        // After signup, fetch the updated user data with roles
        await validateSession();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Signup failed";
        setError({
          message,
          field: "general",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return { success: false, error: message };
      }
    },
    [validateSession]
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
        roles: null,
        profiles: null,
        isLoading: false,
        isAuthenticated: false,
      });
      setError(null);
    }
  }, []);

  return {
    ...state,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
