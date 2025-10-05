"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminLoginRequest,
} from "@/constants/admin";
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

  // Initialize admin auth state - validate with backend first (cookie-based)
  useEffect(() => {
    if (!mounted) return; // Wait for mounted state
    validateSession();
  }, [mounted]);

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
  }, []);

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

  const login = useCallback(async (data: AdminLoginRequest) => {
    setLoading(true);
    try {
      const response = await adminAuthAPI.login(data);

      if (!response.success) {
        throw new Error(response.message || "Login failed");
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
        // Ignore post-login data fetch errors
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        adminAuthAPI.logout(),
        mutualLogout.clearUserSession(),
      ]);
    } catch {
      // Ignore logout API errors
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
    login,
    logout,
    validateSession,
    fetchIPWhitelist: () => fetchIPWhitelist(),
  };
}
