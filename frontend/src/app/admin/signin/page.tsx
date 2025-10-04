"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminSigninPage() {
  const { isAuthenticated, loading: authLoading, signin } = useAdminAuth();
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

    try {
      await signin({
        username: formData.username,
        password: formData.password,
      });
      router.push("/admin/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Signin failed. Please try again.";

      if (
        errorMessage.includes("403") ||
        errorMessage.includes("IP address not whitelisted")
      ) {
        setError(
          "Your IP address is blocked. Contact the administrator for access."
        );
      } else if (errorMessage.includes("invalid credentials")) {
        setError("Invalid username or password.");
      } else if (errorMessage.includes("Authentication required")) {
        setError("Session expired. Please try again.");
      } else {
        setError(errorMessage);
      }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Checking signin status...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // If already authenticated, render nothing (redirect happens above)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center px-(--space-m) max-w-[1536px] mx-auto w-full">
      <div className="flex flex-col max-w-md w-full">
        <div className="text-center mb-(--space-l)">
          <h2 className="text-5 font-bold line-height-0">Admin Portal</h2>
        </div>

        <form
          className="flex flex-col gap-y-(--space-l)"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col space-y-(--space-s)">
            <div>
              <label
                htmlFor="username"
                className="block text-0 font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 text-0 border border-black/50 focus:ring-maroon focus:border-maroon placeholder-black/30 text-gray-900 rounded-lg focus:outline-none focus:z-10"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-0 font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 text-0 border border-black/50 focus:ring-maroon focus:border-maroon placeholder-black/30 text-gray-900 rounded-lg focus:outline-none focus:z-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-(--space-s)">
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
                  <p className="text-0 text-red-600">
                    {error || "An error occurred. Please try again."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-(--space-2xs) px-(--space-s) border border-transparent text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-(--space-s) w-(--space-s) border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center text--1 text-gray-600">
            <p>If you need an admin account, contact the administrator.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
