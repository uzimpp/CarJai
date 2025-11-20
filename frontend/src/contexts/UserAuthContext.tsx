"use client";

import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  User,
  SigninRequest,
  SignupRequest,
  UserRoles,
  UserProfiles,
} from "@/types/user";
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
  signin: (
    data: SigninRequest
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    data: SignupRequest
  ) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<void>;
  clearError: () => void;
  validateSession: () => Promise<void>;
}

interface AuthErrorWithField {
  message: string;
  field?: string;
}

interface UserAuthContextType extends AuthState, AuthActions {
  error: AuthErrorWithField | null;
}

export const UserAuthContext = createContext<UserAuthContextType | undefined>(
  undefined
);

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathname = useRef<string>("");
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    roles: null,
    profiles: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = useState<AuthErrorWithField | null>(null);

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateSession = useCallback(async () => {
    // Don't validate on server side
    if (typeof window === "undefined") {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

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

  // Initial validation on mount (only on client)
  useEffect(() => {
    if (mounted) {
      // Wrap async call to prevent unhandled promise rejections
      validateSession().catch((error) => {
        // Errors are already handled inside validateSession, but we catch here
        // to prevent unhandled promise rejections that cause Next.js errors
        console.debug("Session validation error (handled):", error);
      });
    }
  }, [mounted, validateSession]);

  // Only re-validate when transitioning between protected and public areas
  useEffect(() => {
    if (!mounted) return;

    const prevPathname = lastPathname.current;
    lastPathname.current = pathname;

    // Skip on initial mount
    if (prevPathname === "") return;

    // Define protected routes
    const protectedRoutes = ["/settings", "/favorites", "/listings", "/sell"];
    const wasProtectedRoute = protectedRoutes.some((route) =>
      prevPathname.startsWith(route)
    );
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Only re-validate if transitioning between protected and public routes
    // This prevents revalidating on every route change within the same area
    if (wasProtectedRoute !== isProtectedRoute) {
      // Wrap async call to prevent unhandled promise rejections
      validateSession().catch((error) => {
        // Errors are already handled inside validateSession, but we catch here
        // to prevent unhandled promise rejections that cause Next.js errors
        console.debug("Session validation error (handled):", error);
      });
    }
  }, [pathname, mounted, validateSession]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signin = useCallback(
    async (data: SigninRequest) => {
      setError(null);
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await authAPI.signin(data);
        await mutualLogout.clearAdminSession();

        // After signin, fetch the updated user data with roles
        await validateSession();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Signin failed";
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

  const signout = useCallback(async () => {
    try {
      await authAPI.signout();
    } catch {
      // Ignore sign out errors
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

  return (
    <UserAuthContext.Provider
      value={{
        ...state,
        isLoading: state.isLoading || !mounted, // Show loading until mounted
        error,
        signin,
        signup,
        signout,
        clearError,
        validateSession,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}
