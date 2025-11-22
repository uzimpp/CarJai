"use client";
import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getTimeRemaining, isSessionExpiringSoon } from "@/utils/timeUtils";

export default function AdminAccountPage() {
  const { adminUser, adminSession, validateSession, signout, loading } =
    useAdminAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-maroon to-red text-white shadow-sm px-(--space-l) py-(--space-m)">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-(--space-s)">
          <div>
            <h1 className="text-3 bold">Admin Account</h1>
            <p className="text--1 opacity-90">
              View your session and account information
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
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await validateSession();
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing || loading}
              className="px-(--space-s) py-(--space-3xs) bg-white/15 hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={signout}
              className="px-(--space-s) py-(--space-3xs) bg-black/30 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m)">
        {/* Session Information */}
        <div className="bg-white overflow-hidden shadow-[var(--shadow-sm)] rounded-3xl ring-1 ring-gray-100">
          <div className="p-(--space-m)">
            <h2 className="text-1 bold text-grey mb-(--space-xs)">
              Current Session Information
            </h2>
            {loading ? (
              <p className="text--1 text-gray-500">
                Loading session information...
              </p>
            ) : adminSession ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text--1 text-gray-500">IP Address</dt>
                  <dd className="mt-1 text-0 text-gray-900 font-mono">
                    {adminSession.ip_address || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Session Created</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminSession.created_at
                      ? new Date(adminSession.created_at).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Expires At</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminSession.expires_at
                      ? new Date(adminSession.expires_at).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Time Remaining</dt>
                  <dd
                    className={`mt-1 text-0 font-medium ${
                      adminSession.expires_at &&
                      isSessionExpiringSoon(adminSession.expires_at)
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {adminSession.expires_at ? (
                      <>
                        {getTimeRemaining(adminSession.expires_at)}
                        {isSessionExpiringSoon(adminSession.expires_at) && (
                          <span className="ml-2 text--2 bg-red/10 text-red px-(--space-3xs) py-(--space-3xs) rounded-full">
                            Expiring Soon
                          </span>
                        )}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text--1 text-gray-500">
                No session information available. Click Refresh to load session
                data.
              </p>
            )}
          </div>
        </div>

        {/* Admin Information */}
        <div className="bg-white overflow-hidden shadow-[var(--shadow-sm)] rounded-3xl ring-1 ring-gray-100">
          <div className="p-(--space-m)">
            <h2 className="text-1 bold text-grey mb-(--space-xs)">
              Administrator Information
            </h2>
            {loading ? (
              <p className="text--1 text-gray-500">
                Loading account information...
              </p>
            ) : adminUser ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text--1 text-gray-500">Admin ID</dt>
                  <dd className="mt-1 text-0 text-gray-900 font-mono">
                    {adminUser.id}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Username</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser.username || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Display Name</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser.name || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Last Signin</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser.last_login_at
                      ? new Date(adminUser.last_login_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text--1 text-gray-500">Account Created</dt>
                  <dd className="mt-1 text-0 text-gray-900">
                    {adminUser.created_at
                      ? new Date(adminUser.created_at).toLocaleString()
                      : "N/A"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text--1 text-gray-500">
                No account information available. Click Refresh to load account
                data.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
