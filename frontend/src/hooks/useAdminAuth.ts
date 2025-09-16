"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminMeResponse,
  AdminIPWhitelistResponse,
} from "@/constants/admin";
import { adminAuthAPI, adminAuthStorage } from "@/lib/adminAuth";

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [ipWhitelist, setIpWhitelist] = useState<AdminIPWhitelist[]>([]);
  const [loading, setLoading] = useState(true);
  // null = unknown, true = authenticated, false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateSession = useCallback(async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    const token = adminAuthStorage.getToken();
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const data = await adminAuthAPI.getCurrentAdmin(token);
      if (data.success) {
        setAdminUser(data.data.admin);
        setAdminSession(data.data.session);
        setIsAuthenticated(true);
        // Update localStorage with fresh admin data
        adminAuthStorage.setAdmin(data.data.admin);
        // Fetch IP whitelist data
        await fetchIPWhitelist();
      } else {
        throw new Error("Invalid session");
      }
    } catch (error: any) {
      // Check if it's an IP blocked error
      if (error.message?.includes("403") || error.message?.includes("IP")) {
        // Clear any existing session data
        adminAuthStorage.clear();
        setIsAuthenticated(false);
        setAdminUser(null);
        // Redirect to access denied page
        router.push("/access-denied?reason=ip-blocked");
        return;
      }
      // Clear invalid session data
      adminAuthStorage.clear();
      setIsAuthenticated(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchIPWhitelist = useCallback(async () => {
    const token = adminAuthStorage.getToken();
    if (!token) return;

    try {
      const data = await adminAuthAPI.getIPWhitelist(token);
      if (data.success) {
        setIpWhitelist(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch IP whitelist:", error);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      validateSession();
    }
  }, [mounted, validateSession]);

  const logout = async () => {
    const token = adminAuthStorage.getToken();

    try {
      if (token) {
        await adminAuthAPI.logout(token);
      }
    } catch (err) {
      console.warn("Logout API call failed:", err);
    } finally {
      adminAuthStorage.clear();
      setIsAuthenticated(false);
      setAdminUser(null);
      router.push("/admin/login");
    }
  };

  return {
    adminUser,
    adminSession,
    ipWhitelist,
    loading: loading || !mounted,
    isAuthenticated: mounted ? isAuthenticated : null,
    logout,
    validateSession,
    fetchIPWhitelist,
  };
}
