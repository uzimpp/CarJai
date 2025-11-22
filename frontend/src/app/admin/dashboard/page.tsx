"use client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  DashboardStats,
  RecentReport,
  ChartDataPoint,
  BrandDataPoint,
} from "@/types/admin";
import { adminAPI } from "@/lib/adminAPI";

import ActivityAreaChart from "@/components/dashboard/ActivityAreaChart";
import UserRolesDonut from "@/components/dashboard/UserRolesDonut";
import CarStatusDonut from "@/components/dashboard/CarStatusDonut";
import TopBrandsChart from "@/components/dashboard/TopBrandsChart";

export default function AdminDashboard() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCars: 0,
    soldCars: 0,
    pendingReports: 0,
    totalBuyers: 0,
    totalSellers: 0,
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topBrandsData, setTopBrandsData] = useState<BrandDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsData, chartData, brandsData, recentReportsData] =
          await Promise.all([
            adminAPI.getDashboardStats(),
            adminAPI.getChartData("30d"),
            adminAPI.getTopBrands(),
            adminAPI.getRecentReports(),
          ]);

        setStats({
          totalUsers: statsData?.totalUsers ?? 0,
          activeCars: statsData?.activeCars ?? 0,
          soldCars: statsData?.soldCars ?? 0,
          pendingReports: statsData?.pendingReports ?? 0,
          totalBuyers: statsData?.totalBuyers ?? 0,
          totalSellers: statsData?.totalSellers ?? 0,
        });
        setChartData(Array.isArray(chartData) ? chartData : []);
        setTopBrandsData(Array.isArray(brandsData) ? brandsData : []);
        setRecentReports(
          Array.isArray(recentReportsData) ? recentReportsData : []
        );
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats({
          totalUsers: 0,
          activeCars: 0,
          soldCars: 0,
          pendingReports: 0,
          totalBuyers: 0,
          totalSellers: 0,
        });
        setChartData([]);
        setTopBrandsData([]);
        setRecentReports([]);
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

  // Wait for auth to finish loading
  if (authLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <div className="text-lg mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3 bold">Dashboard</h1>
      </div>
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
            <div className="p-3 bg-rose-100 rounded-full">
              <svg
                className="w-8 h-8 text-rose-600"
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

      {/* --- Row 1: Activity Chart & User Roles --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m) mb-(--space-l)">
        {/* Col 1.1: Activity Chart (Line) */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
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
            <ActivityAreaChart data={chartData} />
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Daily activity trends
          </p>
        </div>

        {/* Col 1.2: User Roles (Donut) */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-1 font-bold text-gray-900">User Roles</h2>
          </div>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
            </div>
          ) : (
            <UserRolesDonut
              buyers={stats.totalBuyers}
              sellers={stats.totalSellers}
            />
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Buyer vs. Seller distribution
          </p>
        </div>
      </div>

      {/* --- Row 2: Top Brands & Car Status --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m) mb-(--space-l)">
        {/* Col 2.1: Car Status (Donut) */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-1 font-bold text-gray-900">Car Status</h2>
          </div>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
            </div>
          ) : (
            <CarStatusDonut active={stats.activeCars} sold={stats.soldCars} />
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Active vs. Sold listings
          </p>
        </div>

        {/* Col 2.2: Top 10 Brands (Bar) */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-1 font-bold text-gray-900">Top 10 Brands</h2>
          </div>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
            </div>
          ) : (
            <TopBrandsChart data={topBrandsData} />
          )}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Top 10 active listings by brand
          </p>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) mt-(--space-l)">
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
        ) : !recentReports ||
          !Array.isArray(recentReports) ||
          recentReports.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>No recent reports</p>
          </div>
        ) : (
          <div className="space-y-(--space-s) max-h-64 overflow-y-auto">
            {recentReports.map((report) => {
              const isUserReport = report.reportType === "seller";
              const targetId = isUserReport ? report.sellerId : report.carId;

              return (
                <Link
                  key={report.id}
                  href={`/admin/reports?id=${report.id}`}
                  className="flex items-start gap-(--space-s) p-(--space-s) bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div
                    className={`p-2 rounded-full flex-shrink-0 ${
                      isUserReport ? "bg-red-100" : "bg-rose-100"
                    }`}
                  >
                    {isUserReport ? (
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
                        className="w-5 h-5 text-rose-600"
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
                        {isUserReport
                          ? `User #${targetId}`
                          : `Car #${targetId}`}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.status === "pending"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text--1 text-gray-600 truncate">
                      {report.description}
                    </p>
                    <p className="text--2 text-gray-500 mt-1">
                      Reported by User #{report.reporterId} •{" "}
                      {formatTimeAgo(report.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
