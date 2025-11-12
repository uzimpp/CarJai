"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type ReportType = "user" | "car";
type ReportStatus = "pending" | "resolved" | "dismissed";

interface FraudReport {
  id: number;
  type: ReportType;
  reportedById: number;
  reportedByName: string;
  reportedByEmail: string;
  targetUserId?: number;
  targetUserName?: string;
  targetCarId?: number;
  targetCarTitle?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export default function AdminReportsPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [reports, setReports] = useState<FraudReport[]>([]);
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

        // TODO: Replace with actual admin reports API endpoint
        // const params = new URLSearchParams();
        // if (filterType !== "all") params.append("type", filterType);
        // if (filterStatus !== "all") params.append("status", filterStatus);
        //
        // const result = await apiCall<{
        //   success: boolean;
        //   data: FraudReport[];
        // }>(`/admin/reports?${params.toString()}`, {
        //   method: "GET",
        // });
        //
        // if (result.success && result.data) {
        //   setReports(result.data);
        // } else {
        //   setError("Failed to load reports");
        // }

        // Placeholder: Empty reports for now
        setReports([]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchReports();
    }
  }, [filterType, filterStatus, authLoading, isAuthenticated]);

  const handleResolve = async (reportId: number) => {
    setActionLoading(reportId);
    try {
      // TODO: Replace with actual API call
      // await apiCall(`/admin/reports/${reportId}/resolve`, {
      //   method: "POST",
      // });
      // Refresh reports
      // fetchReports();
      alert("Report resolved (API integration pending)");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve report");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (reportId: number) => {
    if (!confirm("Are you sure you want to dismiss this report?")) return;

    setActionLoading(reportId);
    try {
      // TODO: Replace with actual API call
      // await apiCall(`/admin/reports/${reportId}/dismiss`, {
      //   method: "POST",
      // });
      // Refresh reports
      // fetchReports();
      alert("Report dismissed (API integration pending)");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to dismiss report");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: number, reportId: number) => {
    if (!confirm("Are you sure you want to ban this user?")) return;

    setActionLoading(reportId);
    try {
      // TODO: Replace with actual API call
      // await apiCall(`/admin/users/${userId}/ban`, {
      //   method: "POST",
      // });
      // await handleResolve(reportId);
      alert("User banned (API integration pending)");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCar = async (carId: number, reportId: number) => {
    if (!confirm("Are you sure you want to remove this car listing?")) return;

    setActionLoading(reportId);
    try {
      // TODO: Replace with actual API call
      // await apiCall(`/admin/cars/${carId}/remove`, {
      //   method: "POST",
      // });
      // await handleResolve(reportId);
      alert("Car listing removed (API integration pending)");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove car");
    } finally {
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
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Total Reports</p>
          <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">User Reports</p>
          <p className="text-3xl font-bold text-gray-900">{userReportsCount}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
          <p className="text--1 text-gray-600 mb-1">Car Reports</p>
          <p className="text-3xl font-bold text-gray-900">{carReportsCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
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
      <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] overflow-hidden">
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
                ? "No reports found. API integration pending."
                : "No reports match the current filters."}
            </p>
            {reports.length === 0 && (
              <p className="text--1 text-gray-500 mt-2">
                Connect to{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  /admin/reports
                </code>{" "}
                endpoint to display reports.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Column headers - desktop */}
            <div className="hidden md:grid md:grid-cols-[1.3fr_1.6fr_1.4fr_1.2fr_1fr_220px] gap-(--space-2xs) px-(--space-m) py-(--space-2xs) bg-gray-50">
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Reported By
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Date
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Status
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider text-center">
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
                  className="px-(--space-m) py-(--space-s) grid grid-cols-1 md:grid-cols-[1.3fr_1.6fr_1.4fr_1.2fr_1fr_220px] items-start gap-(--space-2xs)"
                >
                  {/* Subject + badges (mobile shows both here) */}
                  <div className="flex items-start gap-(--space-s)">
                    <span
                      className={`px-(--space-s) py-(--space-3xs) rounded-full text--1 font-medium ${
                        report.type === "user"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {report.type === "user" ? "User" : "Car"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-0 font-medium text-gray-900 truncate">
                        {subjectText}
                      </p>
                      <p className="text--1 text-gray-600 md:hidden mt-0.5">
                        {report.reason}
                      </p>
                      <p className="text--2 text-gray-500 md:hidden">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Reported By */}
                  <div className="hidden md:block text-0 text-gray-900 truncate">
                    {report.reportedByName} ({report.reportedByEmail})
                  </div>

                  {/* Reason */}
                  <div className="hidden md:block text-0 text-gray-700 truncate">
                    {report.reason}
                  </div>

                  {/* Date */}
                  <div className="hidden md:block text--1 text-gray-500">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-2">
                    <span
                      className={`px-(--space-s) py-(--space-3xs) rounded-full text--1 font-medium ${
                        report.status === "pending"
                          ? "bg-red-100 text-red-700"
                          : report.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {report.status.charAt(0).toUpperCase() +
                        report.status.slice(1)}
                    </span>
                    {report.resolvedBy && report.status !== "pending" && (
                      <span className="text--2 text-gray-500">
                        by {report.resolvedBy}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-(--space-xs) md:mt-0 flex flex-wrap md:justify-center gap-(--space-2xs)">
                    {report.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={actionLoading === report.id}
                          className="px-(--space-m) py-(--space-2xs) rounded-lg bg-green-600 hover:bg-green-700 text-white text-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === report.id
                            ? "Processing..."
                            : "Resolve"}
                        </button>
                        <button
                          onClick={() => handleDismiss(report.id)}
                          disabled={actionLoading === report.id}
                          className="px-(--space-m) py-(--space-2xs) rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === report.id
                            ? "Processing..."
                            : "Dismiss"}
                        </button>
                        {report.type === "user" && report.targetUserId && (
                          <button
                            onClick={() =>
                              handleBanUser(report.targetUserId!, report.id)
                            }
                            disabled={actionLoading === report.id}
                            className="px-(--space-m) py-(--space-2xs) rounded-lg bg-red-600 hover:bg-red-700 text-white text-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === report.id
                              ? "Processing..."
                              : "Ban User"}
                          </button>
                        )}
                        {report.type === "car" && report.targetCarId && (
                          <button
                            onClick={() =>
                              handleRemoveCar(report.targetCarId!, report.id)
                            }
                            disabled={actionLoading === report.id}
                            className="px-(--space-m) py-(--space-2xs) rounded-lg bg-red-600 hover:bg-red-700 text-white text-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === report.id
                              ? "Processing..."
                              : "Remove Car"}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text--1 text-gray-500">
                        {report.status === "resolved"
                          ? "Resolved"
                          : "Dismissed"}
                        {report.resolvedBy &&
                          ` by ${report.resolvedBy}${
                            report.resolvedAt
                              ? ` on ${new Date(
                                  report.resolvedAt
                                ).toLocaleString()}`
                              : ""
                          }`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
