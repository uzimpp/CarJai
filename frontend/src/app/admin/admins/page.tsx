"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { AdminUser, AdminAdminsListResponse } from "@/types/admin";
import PaginateControl from "@/components/ui/PaginateControl";

export default function AdminAdminsPage() {
  const { loading: authLoading, isAuthenticated, admin } = useAdminAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // --- Modal & Form States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Load admins from API
  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/admins');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admins: ${response.statusText}`);
      }
      
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

  useEffect(() => {
    if (!authLoading && isAuthenticated && admin) {
      if (admin.role !== 'super_admin') {
        router.push('/admin/dashboard');
      }
    }
    if (authLoading || !isAuthenticated) return;
    fetchAdmins();
  }, [authLoading, isAuthenticated, admin, router]);

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
    setPage(1); 
  }, [admins, searchQuery]);

  // --- Handle Create Admin ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create admin");
      }

      // Success: Reset form, close modal, refresh list
      setFormData({ username: "", name: "", password: "" });
      setIsModalOpen(false);
      fetchAdmins(); // Reload table
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination logic
  const totalRows = filteredAdmins.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

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

  if (admin?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m) relative">
      
      {/* --- Modal Overlay --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Add New Admin</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a new account with Admin privileges.
              </p>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
                  placeholder="e.g., admin_jane"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
                  placeholder="e.g., Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ username: "", name: "", password: "" });
                    setFormError(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-maroon/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: '#800000' }} // Fallback for custom color class
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Creating...
                    </>
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-(--space-2xs)">
        <div>
          <h1 className="text-3 bold">Admin Management</h1>
        </div>
        {/* --- Add Admin Button --- */}
        <div className="flex flex-row justify-end items-center gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-maroon text-white text-sm font-medium rounded-full hover:bg-maroon/90 transition-all shadow-sm flex items-center gap-2"
            style={{ backgroundColor: '#800000' }} // Use direct hex if class missing
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Admin
          </button>
        </div>
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