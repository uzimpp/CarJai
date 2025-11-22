"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminAPI } from "@/lib/adminAPI";
import { useToast } from "@/components/ui/Toast";
import type { AdminReport, ReportType, ReportStatus } from "@/types/report";

export default function AdminReportsPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const { showToast, ToastContainer } = useToast();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ReportType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      if (authLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await adminAPI.listReports({
          type: filterType !== "all" ? filterType : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
        });

        if (result.success && result.data) {
          setReports(result.data.reports);
          setTotal(result.data.total);
        } else {
          setError("Failed to load reports");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        // Don't show authentication errors - the auth system will handle redirects
        if (
          !errorMessage.includes("Authentication") &&
          !errorMessage.includes("Unauthorized")
        ) {
          setError(errorMessage);
        }
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchReports();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
      setReports([]);
    }
  }, [filterType, filterStatus, authLoading, isAuthenticated]);

  const refreshReports = async () => {
    const result = await adminAPI.listReports({
      type: filterType !== "all" ? filterType : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
    });
    if (result.success && result.data) {
      setReports(result.data.reports);
      setTotal(result.data.total);
    }
  };

  const handleResolve = async (reportId: number) => {
    setActionLoading(reportId);
    try {
      const res = await adminAPI.resolveReport(reportId);
      if (!res.success) {
        throw new Error(res.message || "Failed to resolve report");
      }
      showToast("Report resolved successfully", "success");
      await refreshReports();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to resolve report";
      showToast(errorMessage, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reportId: number) => {
    if (!confirm("Are you sure you want to dismiss this report?")) return;

    setActionLoading(reportId);
    try {
      const res = await adminAPI.dismissReport(reportId);
      if (!res.success) {
        throw new Error(res.message || "Failed to dismiss report");
      }
      showToast("Report dismissed successfully", "success");
      await refreshReports();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to dismiss report";
      showToast(errorMessage, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: number, reportId: number) => {
    if (!confirm("Are you sure you want to ban this user?")) return;

    setActionLoading(reportId);
    try {
      const res = await adminAPI.banUser(userId);
      if (!res.success) {
        throw new Error(res.message || "Failed to ban user");
      }
      showToast("User banned successfully", "success");
      // Resolve the report after banning
      await handleResolve(reportId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to ban user";
      showToast(errorMessage, "error");
      setActionLoading(null);
    }
  };

  const handleRemoveCar = async (carId: number, reportId: number) => {
    if (!confirm("Are you sure you want to remove this car listing?")) return;

    setActionLoading(reportId);
    try {
      const res = await adminAPI.removeCar(carId);
      if (!res.success) {
        throw new Error(res.message || "Failed to remove car");
      }
      showToast("Car listing removed successfully", "success");
      // Resolve the report after removing car
      await handleResolve(reportId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove car";
      showToast(errorMessage, "error");
      setActionLoading(null);
    }
  };

  // Show loading while authentication is being checked
  if (authLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <div className="text-lg mb-2">Checking permissions...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in admin layout)
  if (isAuthenticated === false) {
    return null;
  }

  const filteredReports = reports.filter((report) => {
    if (filterType !== "all" && report.type !== filterType) return false;
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const userReportsCount = reports.filter((r) => r.type === "user").length;
  const carReportsCount = reports.filter((r) => r.type === "car").length;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Header */}
      <div>
        <h1 className="text-3 bold">Fraud Reports</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-(--space-m)">
        <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Total Reports</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">User Reports</p>
          <p className="text-3xl font-bold text-gray-900">{userReportsCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Car Reports</p>
          <p className="text-3xl font-bold text-gray-900">{carReportsCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
        <div className="flex flex-wrap gap-(--space-s)">
          {/* Type Filter */}
          <div className="flex gap-(--space-2xs)">
            <span className="text-0 text-gray-700 font-medium py-2">Type:</span>
            <button
              onClick={() => setFilterType("all")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterType === "all"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("user")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterType === "user"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setFilterType("car")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterType === "car"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cars
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-(--space-2xs)">
            <span className="text-0 text-gray-700 font-medium py-2">
              Status:
            </span>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterStatus === "all"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterStatus === "pending"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus("resolved")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterStatus === "resolved"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => setFilterStatus("dismissed")}
              className={`px-(--space-s) py-(--space-2xs) rounded-lg text-0 ${
                filterStatus === "dismissed"
                  ? "bg-maroon text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Dismissed
            </button>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-(--space-m) py-(--space-s) border-b border-gray-200">
          <h2 className="text-2 font-bold text-gray-900">
            Reports{" "}
            {filteredReports.length > 0 && `(${filteredReports.length})`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-(--space-m)">
            <div className="bg-red-50 border border-red-200 rounded-xl p-(--space-m) text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-(--space-l) text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-1a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600">
              {reports.length === 0
                ? "No reports found."
                : "No reports match the current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Column headers - desktop */}
            <div className="hidden md:grid md:grid-cols-[200px_250px_180px_150px_140px_1fr] gap-4 px-(--space-m) py-(--space-s) bg-gray-50 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Subject
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reported By
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reason
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {filteredReports.map((report) => {
              const subjectText =
                report.type === "user"
                  ? report.targetUserName || `User #${report.targetUserId}`
                  : report.targetCarTitle || `Car #${report.targetCarId}`;

              return (
                <div
                  key={report.id}
                  className="px-(--space-m) py-(--space-m) grid grid-cols-1 md:grid-cols-[200px_250px_180px_150px_140px_1fr] items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Subject + badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                        report.type === "user"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {report.type === "user" ? "User" : "Car"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {subjectText}
                      </p>
                      <p className="text-xs text-gray-600 md:hidden mt-1">
                        {report.reason}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden mt-0.5">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Reported By */}
                  <div className="hidden md:block">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {report.reportedByName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {report.reportedByEmail}
                    </p>
                  </div>

                  {/* Reason */}
                  <div className="hidden md:block text-sm text-gray-700 truncate">
                    {report.reason}
                  </div>

                  {/* Date */}
                  <div className="hidden md:block text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                    <br />
                    {new Date(report.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Status */}
                  <div className="hidden md:block">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        report.status === "pending"
                          ? "bg-red-100 text-red-800"
                          : report.status === "resolved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status.charAt(0).toUpperCase() +
                        report.status.slice(1)}
                    </span>
                    {report.resolvedBy && report.status !== "pending" && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {report.resolvedBy}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 md:mt-0 flex flex-wrap md:justify-end gap-2">
                    {report.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={actionLoading === report.id}
                          className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === report.id ? "..." : "Resolve"}
                        </button>
                        <button
                          onClick={() => handleDismiss(report.id)}
                          disabled={actionLoading === report.id}
                          className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === report.id ? "..." : "Dismiss"}
                        </button>
                        {report.type === "user" && report.targetUserId && (
                          <button
                            onClick={() =>
                              handleBanUser(report.targetUserId!, report.id)
                            }
                            disabled={actionLoading === report.id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading === report.id ? "..." : "Ban User"}
                          </button>
                        )}
                        {report.type === "car" && report.targetCarId && (
                          <button
                            onClick={() =>
                              handleRemoveCar(report.targetCarId!, report.id)
                            }
                            disabled={actionLoading === report.id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading === report.id ? "..." : "Remove Car"}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        {report.status === "resolved"
                          ? "Resolved"
                          : "Dismissed"}
                        {report.resolvedAt &&
                          ` on ${new Date(
                            report.resolvedAt
                          ).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {ToastContainer}
    </div>
  );
}
