"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminUser, AdminAdminsListResponse } from "@/types/admin"; // Import types จากไฟล์ของคุณ
import PaginateControl from "@/components/ui/PaginateControl";

export default function AdminAdminsPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Load admins from API
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchAdmins = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/admins');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch admins: ${response.statusText}`);
        }
        
        // ใช้ Type AdminAdminsListResponse ที่เราเพิ่มเข้าไป
        const data: AdminAdminsListResponse = await response.json();

        if (data.success) {
          setAdmins(data.data);
        } else {
          throw new Error('Failed to fetch admins');
        }

        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, [authLoading, isAuthenticated]);

  // Client-side filtering
  useEffect(() => {
    let filtered = [...admins];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(query) ||
          admin.username.toLowerCase().includes(query)
      );
    }

    setFilteredAdmins(filtered);
    setPage(1); // Reset to page 1 when filter changes
  }, [admins, searchQuery]);

  // Pagination logic
  const totalRows = filteredAdmins.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading State
  if (authLoading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <div className="text-lg mb-2">Checking permissions...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) return null;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-(--space-2xs)">
        <div>
          <h1 className="text-3 bold">Admin Management</h1>
        </div>
        {/* ปุ่ม Add Admin (เตรียมไว้สำหรับอนาคต) */}
        {/* <div className="flex flex-row justify-end items-center gap-2">
          <button className="...">Add Admin</button>
        </div> */}
      </div>

      <section className="flex flex-col gap-(--space-s-m)">
        {/* Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-(--space-s)">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)]">
          <div className="divide-y divide-gray-200">
            {/* Column Headers */}
            <div className="hidden md:grid md:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] gap-(--space-2xs) p-(--space-xs) bg-gray-50 rounded-t-lg">
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                ID
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Username
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Name
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Role</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </div>
            </div>

            {/* Loading / Error / Empty States */}
            {isLoading ? (
              <div className="text-center py-20">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mb-4"></div>
                  <p className="text-gray-600">Loading admins...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center inline-block">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No admins found</p>
              </div>
            ) : (
              /* Data Rows */
              <>
                {paginatedAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr] gap-(--space-2xs) p-(--space-xs) transition-colors items-center hover:bg-gray-50"
                  >
                    {/* ID */}
                    <div className="hidden md:block text--1 text-gray-900">
                      #{admin.id}
                    </div>

                    {/* Username */}
                    <div className="text--1 font-medium text-gray-900">
                      {admin.username}
                      {/* Mobile: ID shown next to username */}
                      <span className="md:hidden ml-2 text-gray-400 text-xs">#{admin.id}</span>
                    </div>

                    {/* Name */}
                    <div className="text--1 text-gray-600">
                      {admin.name}
                    </div>
                    
                    {/* Role */}
                    <div className="hidden md:block">
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        admin.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                    >
                        {admin.role ? admin.role.replace("_", " ") : "Admin"}
                    </span>
                    </div>

                    {/* Last Login */}
                    <div className="text--1 text-gray-500 text-sm">
                      <span className="md:hidden font-medium mr-1">Last Login:</span>
                      {formatDate(admin.last_login_at)}
                    </div>

                    {/* Created At */}
                    <div className="hidden md:block text--1 text-gray-500">
                      {formatDate(admin.created_at)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Pagination Control */}
        {filteredAdmins.length > 0 && (
          <div className="flex justify-end mt-(--space-m)">
            <PaginateControl
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </section>
    </div>
  );
}