"use client";

import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminSigninRequest,
  AdminAuthResponse,
} from "@/types/admin";
import { adminAPI } from "@/lib/adminAPI";
import { mutualLogout } from "@/lib/mutualLogout";

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  admin: AdminUser | null;
  adminSession: AdminSession | null;
  ipWhitelist: AdminIPWhitelist[];
  loading: boolean;
  isAuthenticated: boolean | null;
  signin: (data: AdminSigninRequest) => Promise<AdminAuthResponse>;
  signout: () => Promise<void>;
  validateSession: () => Promise<void>;
  fetchIPWhitelist: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [ipWhitelist, setIpWhitelist] = useState<AdminIPWhitelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const lastPathname = useRef<string>("");

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchIPWhitelist = useCallback(async () => {
    try {
      const data = await adminAPI.getIPWhitelist();
      if (data.success && data.data) {
        setIpWhitelist(data.data as AdminIPWhitelist[]);
      }
    } catch {
      // Ignore fetch errors
    }
  }, []);

  const validateSession = useCallback(async () => {
    if (typeof window === "undefined") {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await adminAPI.getCurrentAdmin();
      if (response.success) {
        setAdminUser(response.data.admin);
        // Check if session exists in the response
        if (response.data.session) {
          setAdminSession(response.data.session);
        } else {
          console.warn(
            "Session data not found in response. Response data:",
            response.data
          );
          setAdminSession(null);
        }
        setIsAuthenticated(true);
        // Fetch IP whitelist silently
        fetchIPWhitelist();
      } else {
        // Handle authentication failure gracefully
        setAdminUser(null);
        setAdminSession(null);
        setIpWhitelist([]);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setAdminUser(null);
      setAdminSession(null);
      setIpWhitelist([]);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [fetchIPWhitelist]);

  useEffect(() => {
    if (mounted) {
      // Wrap async call to prevent unhandled promise rejections
      validateSession().catch((error) => {
        // Errors are already handled inside validateSession, but we catch here
        // to prevent unhandled promise rejections that cause Next.js errors
        console.debug("Admin session validation error (handled):", error);
      });
    }
  }, [mounted, validateSession]);

  // Only re-validate when transitioning in/out of admin area, not on every route change
  useEffect(() => {
    if (!mounted) return;

    const prevPathname = lastPathname.current;
    lastPathname.current = pathname;

    // Skip on initial mount
    if (prevPathname === "") return;

    const wasAdminArea = prevPathname.startsWith("/admin");
    const isAdminArea = pathname.startsWith("/admin");

    // Only re-validate if transitioning between admin and non-admin areas
    // This prevents revalidating on every admin route change (e.g., /admin/dashboard -> /admin/users)
    if (wasAdminArea !== isAdminArea) {
      // Wrap async call to prevent unhandled promise rejections
      validateSession().catch((error) => {
        // Errors are already handled inside validateSession, but we catch here
        // to prevent unhandled promise rejections that cause Next.js errors
        console.debug("Admin session validation error (handled):", error);
      });
    }
  }, [pathname, mounted, validateSession]);

  const signin = useCallback(async (data: AdminSigninRequest) => {
    setLoading(true);
    try {
      const response = await adminAPI.signin(data);

      if (!response.success) {
        throw new Error(response.message || "Signin failed");
      }

      await mutualLogout.clearUserSession();
      setAdminUser(response.data.admin);
      setIsAuthenticated(true);

      // Fetch session and whitelist data silently
      try {
        const [sessionResponse, whitelistData] = await Promise.all([
          adminAPI.getCurrentAdmin(),
          adminAPI.getIPWhitelist(),
        ]);

        if (sessionResponse.success) {
          setAdminSession(sessionResponse.data.session);
        }
        if (whitelistData.success && whitelistData.data) {
          setIpWhitelist(whitelistData.data as AdminIPWhitelist[]);
        }
      } catch {
        // Ignore post-signin data fetch errors
      }

      return response as AdminAuthResponse;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await Promise.all([adminAPI.signout(), mutualLogout.clearUserSession()]);
    } catch {
      // Ignore sign out API errors
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setAdminSession(null);
      setIpWhitelist([]);
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        admin: adminUser,
        adminSession,
        ipWhitelist,
        loading: loading || !mounted,
        isAuthenticated: mounted ? isAuthenticated : null,
        signin,
        signout,
        validateSession,
        fetchIPWhitelist: () => fetchIPWhitelist(),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
