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
import { adminAuthStorage } from "@/lib/adminAuth";
import { config } from "@/config/env";

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

  // Initialize admin auth state from localStorage and cookies
  useEffect(() => {
    if (!mounted) return; // Wait for mounted state

    console.log("🔍 Admin auth initialization - checking existing session...");
    const token = adminAuthStorage.getToken();
    const admin = adminAuthStorage.getAdmin();

    console.log("🔍 Admin auth - Token:", token, "Admin:", admin);

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
      const token = adminAuthStorage.getToken();
      if (!token) return;

      const response = await fetch(`${config.apiUrl}/admin/ip-whitelist`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data: AdminIPWhitelistResponse = await response.json();
        if (data.success) {
          setIpWhitelist(data.data);
        }
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

    const token = adminAuthStorage.getToken();
    const admin = adminAuthStorage.getAdmin();

    // If we have admin data but no token, assume cookie-based auth
    if (admin && !token) {
      console.log("🔍 Admin data exists but no token, using cookie-based auth");
      setAdminUser(admin);
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      // Create a timeout promise that rejects after 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Authentication timeout")), 30000);
      });

      // Race between the fetch and timeout
      const response = (await Promise.race([
        fetch(`${config.apiUrl}/admin/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include", // Include cookies
        }),
        timeoutPromise,
      ])) as Response;

      if (response.ok) {
        const data: AdminMeResponse = await response.json();
        if (data.success) {
          setAdminUser(data.data.admin);
          setAdminSession(data.data.session);
          setIsAuthenticated(true);
          // Update localStorage with fresh admin data
          adminAuthStorage.setAdmin(data.data.admin);
          // Fetch IP whitelist data
          try {
            const response = await fetch(
              `${config.apiUrl}/admin/ip-whitelist`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                credentials: "include", // Include cookies
              }
            );

            if (response.ok) {
              const data: AdminIPWhitelistResponse = await response.json();
              if (data.success) {
                setIpWhitelist(data.data);
              }
            }
          } catch (error) {
            console.error("Failed to fetch IP whitelist:", error);
          }
        } else {
          throw new Error("Invalid session");
        }
      } else if (response.status === 403) {
        // Clear any existing session data
        adminAuthStorage.clear();
        setIsAuthenticated(false);
        setAdminUser(null);
        setAdminSession(null);
        // Redirect to access denied page
        router.push(
          "/not-found?code=403&title=ปฏิเสธการเข้าถึง&message=IP address is not authorized"
        );
        return;
      } else {
        // Any other error status means invalid session
        throw new Error("Invalid session");
      }
    } catch (error) {
      console.error("Admin session validation failed:", error);
      // Clear invalid session data
      adminAuthStorage.clear();
      setIsAuthenticated(false);
      setAdminUser(null);
      setAdminSession(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      validateSession();
    }
  }, [mounted, validateSession]);

  const logout = async () => {
    try {
      const token = adminAuthStorage.getToken();
      if (token) {
        await fetch(`${config.apiUrl}/admin/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include", // Include cookies
          body: JSON.stringify({}), // Empty body since backend reads from cookie
        });
      }
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
