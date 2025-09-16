"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/config/env";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminAuthStorage } from "@/lib/adminAuth";
import { mutualLogout, authStorage } from "@/lib/auth";

export default function AdminLoginPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("🔐 Admin login attempt with:", formData);

    try {
      const response = await fetch(`${config.apiUrl}/admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify(formData),
      });

      console.log("📡 Admin login response status:", response.status);

      if (response.status === 403) {
        // IP is blocked by backend middleware
        setError(
          "Access denied: Your IP address is not authorized to access this system."
        );
        return;
      }

      const data = await response.json();
      console.log("📋 Admin login response data:", data);

      if (data.success) {
        // Clear any existing user session (mutual logout)
        await mutualLogout.clearUserSession();

        // Store admin data
        adminAuthStorage.setAdmin(data.data.admin);
        console.log("💾 Admin data stored:", data.data.admin);

        // Store token if it exists in the response
        if (data.data.token) {
          adminAuthStorage.setToken(data.data.token);
          console.log("💾 Admin token stored:", data.data.token);
        } else {
          console.log(
            "⚠️ No token in admin login response, using cookie-based auth"
          );
        }

        // Redirect to admin dashboard
        console.log("🔀 Redirecting to admin dashboard...");
        router.push("/admin/dashboard");
        console.log("✨ Admin redirect called");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Admin login error:", err);
      setError("Network error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // While checking existing session, show a quick loader to avoid flicker
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg mb-2">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</div>
          <div className="text-sm text-gray-500">โปรดรอสักครู่</div>
        </div>
      </div>
    );
  }

  // If already authenticated, render nothing (redirect happens above)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            เข้าสู่ระบบผู้ดูแล
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ลงชื่อเข้าใช้บัญชีผู้ดูแลระบบของ CarJai
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                ชื่อบัญชี
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red/20 focus:border-red/20 focus:z-10 sm:text-sm"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red/20 focus:border-red/20 focus:z-10 sm:text-sm"
                placeholder="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-600">
                    {error || "เกิดข้อผิดพลาด โปรดลองอีกครั้ง"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red/20 hover:bg-red/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </div>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>หากต้องการบัญชีผู้ดูแล กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </form>
      </div>
    </div>
  );
}
