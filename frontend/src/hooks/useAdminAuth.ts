"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminSigninRequest,
} from "@/types/admin";
import { adminAuthAPI } from "@/lib/adminAuth";
import { mutualLogout } from "@/lib/mutualLogout";

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [ipWhitelist, setIpWhitelist] = useState<AdminIPWhitelist[]>([]);
  const [loading, setLoading] = useState(true);
  // null = unknown, true = authenticated, false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchIPWhitelist = useCallback(async () => {
    try {
      const data = await adminAuthAPI.getIPWhitelist();
      if (data.success) {
        setIpWhitelist(data.data);
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
      const response = await adminAuthAPI.getCurrentAdmin();
      if (response.success) {
        setAdminUser(response.data.admin);
        setAdminSession(response.data.session);
        setIsAuthenticated(true);
        // Fetch IP whitelist silently
        fetchIPWhitelist();
      } else {
        throw new Error("Invalid session");
      }
    } catch {
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
      validateSession();
    }
  }, [mounted, validateSession]);

  // Re-validate on route changes to keep navbar and admin pages in sync
  useEffect(() => {
    if (!mounted) return;
    validateSession();
  }, [pathname, mounted, validateSession]);

  const signin = useCallback(async (data: AdminSigninRequest) => {
    setLoading(true);
    try {
      const response = await adminAuthAPI.signin(data);

      if (!response.success) {
        throw new Error(response.message || "Signin failed");
      }

      await mutualLogout.clearUserSession();
      setAdminUser(response.data.admin);
      setIsAuthenticated(true);

      // Fetch session and whitelist data silently
      try {
        const [sessionResponse, whitelistData] = await Promise.all([
          adminAuthAPI.getCurrentAdmin(),
          adminAuthAPI.getIPWhitelist(),
        ]);

        if (sessionResponse.success) {
          setAdminSession(sessionResponse.data.session);
        }
        if (whitelistData.success) {
          setIpWhitelist(whitelistData.data);
        }
      } catch {
        // Ignore post-signin data fetch errors
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await Promise.all([
        adminAuthAPI.signout(),
        mutualLogout.clearUserSession(),
      ]);
    } catch {
      // Ignore sign out API errors
    } finally {
      setIsAuthenticated(false);
      setAdminUser(null);
      setAdminSession(null);
      setIpWhitelist([]);
    }
  }, []);

  return {
    adminUser,
    adminSession,
    ipWhitelist,
    loading: loading || !mounted,
    isAuthenticated: mounted ? isAuthenticated : null,
    signin,
    signout,
    validateSession,
    fetchIPWhitelist: () => fetchIPWhitelist(),
  };
}
