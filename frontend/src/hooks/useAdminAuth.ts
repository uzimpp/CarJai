"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config/env";

interface AdminUser {
  id: number;
  username: string;
  name: string;
  last_login_at: string;
  created_at: string;
}

interface AdminSession {
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity_at: string;
}

interface AdminMeResponse {
  success: boolean;
  data: {
    admin: AdminUser;
    session: AdminSession;
  };
}

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  // null = unknown, true = authenticated, false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  console.log("useAdminAuth state:", {
    loading,
    isAuthenticated,
    adminUser: !!adminUser,
    mounted,
  });

  const validateSession = useCallback(async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("adminToken");
    console.log("validateSession: token exists:", !!token);

    if (!token) {
      console.log("validateSession: No token, setting not authenticated");
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
          console.log("validateSession: Authentication successful");
          setAdminUser(data.data.admin);
          setIsAuthenticated(true);
          // Update localStorage with fresh admin data
          localStorage.setItem("adminUser", JSON.stringify(data.data.admin));
        } else {
          console.log("validateSession: Invalid session data");
          throw new Error("Invalid session");
        }
      } else if (response.status === 403) {
        console.log("validateSession: Access denied - IP not whitelisted");
        // Clear any existing session data
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
        setAdminUser(null);
        // Redirect to access denied page
        router.push("/access-denied?reason=ip-blocked");
        return;
      } else {
        console.log(
          "validateSession: Session validation failed with status:",
          response.status
        );
        throw new Error("Session validation failed");
      }
    } catch (error) {
      console.error("validateSession: Session validation error:", error);
      // Clear invalid session data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setIsAuthenticated(false);
      setAdminUser(null);
    } finally {
      console.log("validateSession: Setting loading to false");
      setLoading(false);
    }
  }, [router]);

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
      console.error("Logout error:", err);
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
    loading: loading || !mounted,
    isAuthenticated: mounted ? isAuthenticated : null,
    logout,
    validateSession,
  };
}
