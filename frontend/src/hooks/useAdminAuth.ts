"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize admin auth state - validate with backend first (cookie-based)
  useEffect(() => {
    if (!mounted) return; // Wait for mounted state

    console.log("🔍 Admin auth initialization - validating with backend...");
    validateSession();
  }, [mounted]);

  const fetchIPWhitelist = useCallback(async () => {
    try {
      const data = await adminAuthAPI.getIPWhitelist();
      if (data.success) {
        setIpWhitelist(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch IP whitelist:", error);
    }
  }, []);

  const validateSession = useCallback(async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    console.log(
      "🔍 Validating admin session with backend (pure cookie-based)..."
    );

    try {
      // Pure cookie-based validation - no localStorage involved
      const response = await adminAuthAPI.getCurrentAdmin();
      if (response.success) {
        console.log("✅ Admin session validated with backend (cookie-based)");

        // Update React state directly - no localStorage storage
        setAdminUser(response.data.admin);
        setAdminSession(response.data.session);
        setIsAuthenticated(true);
        setLoading(false);

        // Fetch IP whitelist
        try {
          const whitelistData = await adminAuthAPI.getIPWhitelist();
          if (whitelistData.success) {
            setIpWhitelist(whitelistData.data);
          }
        } catch (error) {
          console.error("Failed to fetch IP whitelist:", error);
        }
        return;
      }
    } catch (error) {
      console.error("Admin session validation failed:", error);
    }

    // Validation failed - not authenticated
    console.log("❌ Admin not authenticated (pure cookie-based)");
    setAdminUser(null);
    setAdminSession(null);
    setIpWhitelist([]);
    setLoading(false);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      validateSession();
    }
  }, [mounted, validateSession]);

  // Re-validate on route changes to keep navbar and admin pages in sync
  // Only if not already loading to prevent infinite loops
  useEffect(() => {
    if (!mounted || loading) return;
    validateSession();
  }, [pathname, mounted, validateSession]);

  // Admin login function
  const login = useCallback(async (data: AdminLoginRequest) => {
    try {
      setLoading(true);
      console.log("🔐 Admin login attempt with:", {
        username: data.username,
      });

      const response = await adminAuthAPI.login(data);
      console.log("📋 Admin login response received:", response);

      if (response.success) {
        // Clear any existing user session (mutual logout)
        await mutualLogout.clearUserSession();

        console.log("✅ Admin login successful - cookie-based authentication");

        // Update React state directly - no localStorage storage
        setAdminUser(response.data.admin);
        setIsAuthenticated(true);
        setLoading(false);

        // Fetch current session info after successful login
        try {
          const sessionResponse = await adminAuthAPI.getCurrentAdmin();
          if (sessionResponse.success) {
            setAdminSession(sessionResponse.data.session);
          }
        } catch (error) {
          console.error("Failed to fetch session after login:", error);
        }

        // Fetch IP whitelist
        try {
          const whitelistData = await adminAuthAPI.getIPWhitelist();
          if (whitelistData.success) {
            setIpWhitelist(whitelistData.data);
          }
        } catch (error) {
          console.error("Failed to fetch IP whitelist after login:", error);
        }

        console.log(
          "🔄 Admin state updated - pure cookie-based authentication"
        );
        return response; // Return response for caller to handle redirect
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      console.error("❌ Admin login error:", error);
      setLoading(false);
      throw error; // Re-throw for caller to handle
    }
  }, []);

  const logout = async () => {
    try {
      await adminAuthAPI.logout();

      // Clear any existing user session (mutual logout)
      await mutualLogout.clearUserSession();
    } catch (error) {
      console.error("Admin logout API call failed:", error);
    } finally {
      // Clear React state (no localStorage to clear in pure cookie-based)
      setIsAuthenticated(false);
      setAdminUser(null);
      setAdminSession(null);
      setIpWhitelist([]);
      router.push("/admin/login");
    }
  };

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
