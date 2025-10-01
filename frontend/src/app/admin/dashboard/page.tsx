"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState } from "react";
import { adminAuthAPI } from "@/lib/adminAuth";

export default function AdminDashboard() {
  const router = useRouter();
  const {
    adminUser,
    adminSession,
    ipWhitelist,
    loading,
    isAuthenticated,
    validateSession,
    signout,
  } = useAdminAuth();

  const [ipForm, setIpForm] = useState({ ip: "", description: "" });
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);

  async function handleAddIP(e: React.FormEvent) {
    e.preventDefault();
    setIpError(null);
    setIpLoading(true);
    try {
      const res = await adminAuthAPI.addIP(
        ipForm.ip.trim(),
        ipForm.description.trim()
      );
      if (!res.success) throw new Error(res.message || "Failed to add IP");
      await validateSession();
      setIpForm({ ip: "", description: "" });
    } catch (err) {
      setIpError(err instanceof Error ? err.message : "Failed to add IP");
    } finally {
      setIpLoading(false);
    }
  }

  async function handleRemoveIP(ip: string) {
    setIpError(null);
    setIpLoading(true);
    try {
      const res = await adminAuthAPI.removeIP(ip);
      if (!res.success) throw new Error(res.message || "Failed to remove IP");
      await validateSession();
    } catch (err) {
      setIpError(err instanceof Error ? err.message : "Failed to remove IP");
    } finally {
      setIpLoading(false);
    }
  }

  useEffect(() => {
    console.log("🔍 Admin dashboard - checking auth state:", {
      loading,
      isAuthenticated,
    });
    // Only redirect if we're done loading and definitely not authenticated
    if (!loading && isAuthenticated === false) {
      console.log("❌ Admin not authenticated, redirecting to signin");
      router.push("/admin/signin");
    } else if (!loading && isAuthenticated === true) {
      console.log("✅ Admin authenticated, showing dashboard");
    }
  }, [loading, isAuthenticated, router]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} hours ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const isSessionExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return diff <= 30 * 60 * 1000; // 30 minutes
  };

  // Show loading while authentication is being checked
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">Checking permissions...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="px-(--space-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-maroon to-red text-white shadow-[var(--shadow-lg)] px-(--space-l) py-(--space-m)">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-(--space-s)">
          <div>
            <h1 className="text-3 bold">Admin Dashboard</h1>
            <p className="text--1 opacity-90">
              Manage sessions, security and activity
            </p>
          </div>
          <div className="flex items-center gap-(--space-2xs)">
            {adminSession && (
              <span
                className={`px-(--space-2xs) py-(--space-3xs) rounded-full text--1 ${
                  isSessionExpiringSoon(adminSession.expires_at)
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/15"
                }`}
              >
                Session:{" "}
                {isSessionExpiringSoon(adminSession.expires_at)
                  ? "Expiring soon"
                  : "Active"}
              </span>
            )}
            <button
              onClick={() => validateSession()}
              className="px-(--space-s) py-(--space-3xs) bg-white/15 hover:bg-white/25 rounded-full text-white transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={signout}
              className="px-(--space-s) py-(--space-3xs) bg-black/30 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-(--space-l)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-l)">
          {/* Session Information */}
          <div className="bg-white overflow-hidden shadow-[var(--shadow-md)] rounded-3xl">
            <div className="p-(--space-m)">
              <h2 className="text-1 bold text-grey mb-(--space-xs)">
                Current Session Information
              </h2>
              {adminSession && (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text--1 text-gray-500">IP Address</dt>
                    <dd className="mt-1 text-0 text-gray-900 font-mono">
                      {adminSession.ip_address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text--1 text-gray-500">Session Created</dt>
                    <dd className="mt-1 text-0 text-gray-900">
                      {new Date(adminSession.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text--1 text-gray-500">Expires At</dt>
                    <dd className="mt-1 text-0 text-gray-900">
                      {new Date(adminSession.expires_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text--1 text-gray-500">Time Remaining</dt>
                    <dd
                      className={`mt-1 text-0 font-medium ${
                        isSessionExpiringSoon(adminSession.expires_at)
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {getTimeRemaining(adminSession.expires_at)}
                      {isSessionExpiringSoon(adminSession.expires_at) && (
                        <span className="ml-2 text--2 bg-red/10 text-red px-(--space-3xs) py-(--space-3xs) rounded-full">
                          Expiring Soon
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* IP Whitelist Information */}
          <div className="bg-white overflow-hidden shadow-[var(--shadow-md)] rounded-3xl">
            <div className="p-(--space-m)">
              <h2 className="text-1 bold text-grey mb-(--space-xs)">
                Allowed IP List ({ipWhitelist.length} entries)
              </h2>
              {/* Add/Remove IP controls */}
              <form
                onSubmit={handleAddIP}
                className="mb-(--space-s) grid grid-cols-1 sm:grid-cols-5 gap-(--space-2xs)"
              >
                <input
                  type="text"
                  value={ipForm.ip}
                  onChange={(e) =>
                    setIpForm((f) => ({ ...f, ip: e.target.value }))
                  }
                  placeholder="IP address (e.g. 203.0.113.5)"
                  className="sm:col-span-2 rounded-lg border border-gray-300 px-(--space-s) py-(--space-3xs) text-0 focus:outline-none focus:ring-maroon focus:border-maroon"
                  required
                />
                <input
                  type="text"
                  value={ipForm.description}
                  onChange={(e) =>
                    setIpForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Description (optional)"
                  className="sm:col-span-2 rounded-lg border border-gray-300 px-(--space-s) py-(--space-3xs) text-0 focus:outline-none focus:ring-maroon focus:border-maroon"
                />
                <button
                  type="submit"
                  disabled={ipLoading}
                  className="rounded-full bg-maroon hover:bg-red text-white px-(--space-s) py-(--space-3xs) text-0 disabled:opacity-50"
                >
                  {ipLoading ? "Adding..." : "Add IP"}
                </button>
              </form>
              {ipError && (
                <div className="text--1 text-red mb-(--space-s)">{ipError}</div>
              )}

              {ipWhitelist.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text--1 text-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          Added On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {ipWhitelist.map((ip) => (
                        <tr key={ip.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {ip.ip_address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ip.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-(--space-2xs)">
                            <span>
                              {new Date(ip.created_at).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIP(ip.ip_address)}
                              className="ml-auto text--1 px-(--space-3xs) py-(--space-3xs) rounded-full text-red hover:bg-red/10"
                              disabled={ipLoading}
                              aria-label={`Remove ${ip.ip_address}`}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    No allowed IPs in the system
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Information */}
          <div className="bg-white overflow-hidden shadow-[var(--shadow-md)] rounded-3xl">
            <div className="p-(--space-m)">
              <h2 className="text-1 bold text-grey mb-(--space-xs)">
                Administrator Information
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text--1 text-gray-500">Username</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser?.username}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Display Name</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Last Signin</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser?.last_login_at
                      ? new Date(adminUser.last_login_at).toLocaleString()
                      : "No data"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Account Created</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser?.created_at
                      ? new Date(adminUser.created_at).toLocaleString()
                      : "No data"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
