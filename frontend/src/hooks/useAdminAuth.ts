"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config/env";
import { AdminUser, AdminSession, AdminIPWhitelist, AdminMeResponse, AdminIPWhitelistResponse } from "@/constants/admin";


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

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      // Create a timeout promise that rejects after 1 minute
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Authentication timeout")), 60000);
      });

      // Race between the fetch and timeout
      const response = (await Promise.race([
        fetch(`${config.apiUrl}/admin/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
          localStorage.setItem("adminUser", JSON.stringify(data.data.admin));
          // Fetch IP whitelist data
          await fetchIPWhitelist(token);
        } else {
          throw new Error("Invalid session");
        }
      } else if (response.status === 403) {
        // Clear any existing session data
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
        setAdminUser(null);
        // Redirect to access denied page
        router.push("/access-denied?reason=ip-blocked");
        return;
      } else {
        throw new Error("Session validation failed");
      }
    } catch (error) {
      // Clear invalid session data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setIsAuthenticated(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchIPWhitelist = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/admin/ip-whitelist`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  useEffect(() => {
    if (mounted) {
      validateSession();
    }
  }, [mounted, validateSession]);

  const logout = async () => {
    const token = localStorage.getItem("adminToken");

    try {
      await fetch(`${config.apiUrl}/admin/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
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
    fetchIPWhitelist: (token: string) => fetchIPWhitelist(token),
  };
}
