"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import {
  AdminUser,
  AdminSession,
  AdminIPWhitelist,
  AdminSigninRequest,
} from "@/types/admin";
import { adminAuthAPI } from "@/lib/adminAuth";
import { mutualLogout } from "@/lib/mutualLogout";

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  adminSession: AdminSession | null;
  ipWhitelist: AdminIPWhitelist[];
  loading: boolean;
  isAuthenticated: boolean | null;
  signin: (data: AdminSigninRequest) => Promise<any>;
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
      validateSession();
    }
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

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
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
