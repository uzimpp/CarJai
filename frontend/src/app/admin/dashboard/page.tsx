"use client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeCars: number;
  soldCars: number;
  pendingReports: number;
}

interface RecentReport {
  id: number;
  type: "user" | "car";
  targetId: number;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

interface ChartDataPoint {
  date: string;
  value: number;
}

export default function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCars: 0,
    soldCars: 0,
    pendingReports: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, chartResponse] = await Promise.all([
          fetch("/admin/dashboard/stats"),
          fetch("/admin/dashboard/chart?period=30d"),
        ]);
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch stats");
        }
        if (!chartResponse.ok) {
          throw new Error("Failed to fetch chart data");
        }
        const statsData: DashboardStats = await statsResponse.json();
        const chartData: ChartDataPoint[] = await chartResponse.json();
        
        setStats(statsData);
        setChartData(chartData);

        setRecentReports([
          {
            id: 1,
            type: "user",
            targetId: 2345,
            reason: "Suspicious listing behavior",
            reportedBy: "buyer_123",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 2,
            type: "car",
            targetId: 5678,
            reason: "Potential price manipulation",
            reportedBy: "buyer_456",
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 3,
            type: "user",
            targetId: 3456,
            reason: "Fraudulent profile information",
            reportedBy: "buyer_789",
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 4,
            type: "car",
            targetId: 6789,
            reason: "Misleading vehicle description",
            reportedBy: "buyer_012",
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 5,
            type: "user",
            targetId: 4567,
            reason: "Suspicious transaction patterns",
            reportedBy: "buyer_345",
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
        ]);

      }catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats({
          totalUsers: 0,
          activeCars: 0,
          soldCars: 0,
          pendingReports: 0,
        });
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3 bold">Dashboard</h1>
      </div>
      {/* Main Content */}
      <main>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-(--space-m) mb-(--space-l)">
          {/* Pending Reports */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Pending Reports</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.pendingReports}
                </p>
                <Link
                  href="/admin/reports"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Cars */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Active Cars</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.activeCars}
                </p>
                <Link
                  href="/admin/cars"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  viewBox="0 0 24.00 24.00"
                  fill="none"
                >
                  <path
                    d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Sold Cars */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Sold Cars</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.soldCars}
                </p>
                <Link
                  href="/admin/cars"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.totalUsers.toLocaleString()}
                </p>
                <Link
                  href="/admin/users"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-6.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Reports Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m)">
          {/* Activity Chart */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">
                Activity Overview (Last 30 Days)
              </h2>
            </div>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-xl p-4 flex items-end justify-between gap-1">
                {chartData.map((point, index) => {
                  const height = (point.value / maxChartValue) * 100;
                  return (
                    <div
                      key={index}
                      className="h-full flex-1 flex flex-col items-center group relative"
                    >
                      <div
                        className="w-full bg-maroon rounded-t transition-all hover:bg-red group-hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${point.value} on ${new Date(
                          point.date
                        ).toLocaleDateString()}`}
                      />
                      {index % 5 === 0 && (
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {new Date(point.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Daily activity trends
            </p>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">Recent Reports</h2>
              <Link
                href="/admin/reports"
                className="text-sm text-maroon hover:underline"
              >
                View all →
              </Link>
            </div>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No recent reports</p>
              </div>
            ) : (
              <div className="space-y-(--space-s) max-h-64 overflow-y-auto">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/admin/reports?id=${report.id}`}
                    className="flex items-start gap-(--space-s) p-(--space-s) bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        report.type === "user" ? "bg-red-100" : "bg-orange-100"
                      }`}
                    >
                      {report.type === "user" ? (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-orange-600"
                          viewBox="0 0 24.00 24.00"
                          fill="none"
                        >
                          <path
                            d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-0 font-medium text-gray-900 truncate">
                          {report.type === "user"
                            ? `User #${report.targetId}`
                            : `Car #${report.targetId}`}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-orange-100 text-orange-800"
                              : report.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text--1 text-gray-600 truncate">
                        {report.reason}
                      </p>
                      <p className="text--2 text-gray-500 mt-1">
                        Reported by {report.reportedBy} •{" "}
                        {formatTimeAgo(report.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* API Integration Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-(--space-m) mt-(--space-l)">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This dashboard currently displays placeholder
            data. Connect to the following API endpoints to display real-time
            data:
          </p>
          <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc">
            <li>
              <code>/admin/dashboard/stats</code> - Get dashboard statistics
            </li>
            <li>
              <code>/admin/reports/recent?limit=5</code> - Get recent reports
            </li>
            <li>
              <code>/admin/dashboard/chart?period=30d</code> - Get chart data
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
