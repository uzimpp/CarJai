"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminDashboard() {
  const router = useRouter();
  const { adminUser, adminSession, ipWhitelist, loading, isAuthenticated } =
    useAdminAuth();

  useEffect(() => {
    console.log("🔍 Admin dashboard - checking auth state:", {
      loading,
      isAuthenticated,
    });
    // Only redirect if we're done loading and definitely not authenticated
    if (!loading && isAuthenticated === false) {
      console.log("❌ Admin not authenticated, redirecting to login");
      router.push("/admin/login");
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
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen">
      {/* Header */}
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Session Information */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Current Session Information
              </h2>
              {adminSession && (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      IP Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {adminSession.ip_address}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Session Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(adminSession.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Expires At
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(adminSession.expires_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Time Remaining
                    </dt>
                    <dd
                      className={`mt-1 text-sm font-medium ${
                        isSessionExpiringSoon(adminSession.expires_at)
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {getTimeRemaining(adminSession.expires_at)}
                      {isSessionExpiringSoon(adminSession.expires_at) && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
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
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Allowed IP List ({ipWhitelist.length} entries)
              </h2>
              {ipWhitelist.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Administrator Information
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Display Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Last Login
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {adminUser?.last_login_at
                      ? new Date(adminUser.last_login_at).toLocaleString()
                      : "No data"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Account Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
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
