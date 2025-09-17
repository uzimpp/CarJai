"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminUser, AdminSession, AdminIPWhitelist } from "@/constants/admin";
import { adminAuthStorage, adminAuthAPI } from "@/lib/adminAuth";

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

  // Initialize admin auth state from localStorage and cookies
  useEffect(() => {
    if (!mounted) return; // Wait for mounted state

    console.log("🔍 Admin auth initialization - checking existing session...");
    const admin = adminAuthStorage.getAdmin();

    console.log("🔍 Admin auth - Admin:", admin);

    if (admin) {
      console.log("✅ Found admin data, setting authenticated state");
      setAdminUser(admin);
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      console.log("❌ No admin data found, setting unauthenticated state");
      setIsAuthenticated(false);
      setLoading(false);
    }
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

    const admin = adminAuthStorage.getAdmin();

    // If we have admin data, validate with backend
    if (admin) {
      console.log("🔍 Admin data exists, validating with backend");
      try {
        const response = await adminAuthAPI.getCurrentAdmin();
        if (response.success) {
          console.log("✅ Admin session validated with backend");
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
        // Clear invalid session data
        adminAuthStorage.clear();
      }
    }

    // No admin data or validation failed
    setLoading(false);
    setIsAuthenticated(false);
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

  // Re-validate when admin data changes in localStorage (cross-tab or programmatic changes)
  useEffect(() => {
    if (!mounted) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "adminUser" || e.key === "adminToken") {
        validateSession();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [mounted, validateSession]);

  const logout = async () => {
    try {
      await adminAuthAPI.logout();
    } catch (error) {
      console.error("Admin logout API call failed:", error);
    } finally {
      // Always clear local state regardless of API call result
      adminAuthStorage.clear();
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
    logout,
    validateSession,
    fetchIPWhitelist: () => fetchIPWhitelist(),
  };
}
