"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState } from "react";
import { adminAuthAPI } from "@/lib/adminAuth";

export default function IPWhitelistPage() {
  const router = useRouter();
  const { ipWhitelist, loading, isAuthenticated, validateSession } =
    useAdminAuth();

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
    // Only redirect if we're done loading and definitely not authenticated
    if (!loading && isAuthenticated === false) {
      router.push("/admin/signin");
    }
  }, [loading, isAuthenticated, router]);

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
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-maroon to-red text-white shadow-[var(--shadow-lg)] px-(--space-l) py-(--space-m) mb-(--space-l)">
        <div>
          <h1 className="text-3 bold">IP Whitelist Management</h1>
          <p className="text--1 opacity-90">
            Manage allowed IP addresses for admin access
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
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
                      <th className="px-6 py-3 text-left font-medium">
                        Actions
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ip.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => handleRemoveIP(ip.ip_address)}
                            className="text--1 px-(--space-3xs) py-(--space-3xs) rounded-full text-red hover:bg-red/10"
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
      </main>
    </div>
  );
}
