"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRouter } from "next/navigation";
import type { AdminUser, AdminAdminsListResponse } from "@/types/admin";
import PaginateControl from "@/components/ui/PaginateControl";

// --- Edit Admin Modal ---
function EditAdminModal({
  admin,
  isOpen,
  onClose,
  onSave,
}: {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (adminId: number, data: { name: string; username: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || "",
        username: admin.username || "",
      });
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSave(admin.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Edit Admin</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="flex gap-3 mt-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-maroon/90 transition-all disabled:opacity-50"
              style={{ backgroundColor: '#800000' }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Delete Confirmation Modal ---
function DeleteConfirmationModal({
  admin,
  isOpen,
  onClose,
  onConfirm,
}: {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adminId: number) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !admin) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(admin.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Delete Admin</h3>
            <button onClick={onClose} disabled={isDeleting} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
           <div className="mb-4">
            <p className="text-gray-700">Are you sure you want to delete this admin?</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500">Username</div>
              <div className="font-medium text-gray-900">{admin.username}</div>
              <div className="text-sm text-gray-500 mt-2">Name</div>
              <div className="font-medium text-gray-900">{admin.name}</div>
            </div>
            <p className="text-sm text-red-600 mt-3 font-medium">This action cannot be undone.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAdminsPage() {
  const { loading: authLoading, isAuthenticated, admin: currentUser } = useAdminAuth();
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

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({ username: "", name: "", password: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit/Delete States
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Check Super Admin Role
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      if (currentUser.role !== 'super_admin') {
        router.push('/admin/dashboard'); 
      }
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

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
    if (authLoading || !isAuthenticated) return;
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
    setPage(1); 
  }, [admins, searchQuery]);

  // --- Handlers ---

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create admin");
      }

      setCreateFormData({ username: "", name: "", password: "" });
      setIsCreateModalOpen(false);
      fetchAdmins();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleSaveAdmin = async (adminId: number, data: { name: string; username: string }) => {
    const response = await fetch(`/api/admin/admins/${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update admin");
    }

    // Update local state
    setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, ...data } : a));
  };

  const handleDeleteAdmin = (admin: AdminUser) => {
    setDeletingAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (adminId: number) => {
    const response = await fetch(`/api/admin/admins/${adminId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Failed to delete admin");
    }

    // Update local state
    setAdmins(prev => prev.filter(a => a.id !== adminId));
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

  if (isAuthenticated === false || currentUser?.role !== 'super_admin') return null;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m) relative">
      
      {/* --- Create Modal --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Add New Admin</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a new account with Admin privileges.
              </p>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-6 flex flex-col gap-4">
              {createError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {createError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
                  placeholder="e.g., admin_jane"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon"
                  placeholder="e.g., Jane Doe"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
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
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                />
              </div>

              <div className="flex gap-3 mt-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateFormData({ username: "", name: "", password: "" });
                    setCreateError(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-maroon/90 transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: '#800000' }}
                >
                  {isCreating ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Delete Modals */}
      <EditAdminModal
        admin={editingAdmin}
        isOpen={isEditModalOpen}
        onClose={() => {
           setIsEditModalOpen(false);
           setEditingAdmin(null);
        }}
        onSave={handleSaveAdmin}
      />
      
      <DeleteConfirmationModal
        admin={deletingAdmin}
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingAdmin(null);
        }}
        onConfirm={handleConfirmDelete}
      />


      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-(--space-2xs)">
        <div>
          <h1 className="text-3 bold">Admin Management</h1>
        </div>
        <div className="flex flex-row justify-end items-center gap-2">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-maroon text-white text-sm font-medium rounded-full hover:bg-maroon/90 transition-all shadow-sm flex items-center gap-2"
            style={{ backgroundColor: '#800000' }}
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
            <div className="hidden md:grid md:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_100px] gap-(--space-2xs) p-(--space-xs) bg-gray-50 rounded-t-lg">
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">ID</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Username</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Name</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Role</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Last Login</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">Created At</div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider text-center">Actions</div>
            </div>

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
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_100px] gap-(--space-2xs) p-(--space-xs) transition-colors items-center hover:bg-gray-50"
                  >
                    {/* ID */}
                    <div className="hidden md:block text--1 text-gray-900">#{admin.id}</div>

                    {/* Username */}
                    <div className="text--1 font-medium text-gray-900">
                      {admin.username}
                      <span className="md:hidden ml-2 text-gray-400 text-xs">#{admin.id}</span>
                    </div>

                    {/* Name */}
                    <div className="text--1 text-gray-600">{admin.name}</div>
                    
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
                    
                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2">
                        {/* Disable actions for Super Admin (except maybe by another super admin, but for safety let's disable for root) */}
                        {admin.role !== 'super_admin' && (
                            <>
                                <button 
                                    onClick={() => handleEditAdmin(admin)}
                                    className="p-1.5 text-gray-500 hover:text-maroon hover:bg-red-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDeleteAdmin(admin)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </>
                        )}
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