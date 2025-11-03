"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  created_at: string;
}

interface UserWithRoles extends User {
  roles?: {
    buyer: boolean;
    seller: boolean;
  };
  profiles?: {
    buyerComplete: boolean;
    sellerComplete: boolean;
  };
}

export default function AdminUsersPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual admin users API endpoint
        // const result = await apiCall<{
        //   success: boolean;
        //   data: { users: UserWithRoles[]; total: number };
        // }>(`/admin/users?page=${page}&limit=${limit}`, {
        //   method: "GET",
        // });

        // if (result.success && result.data) {
        //   setUsers(result.data.users);
        //   setTotal(result.data.total);
        // } else {
        //   setError("Failed to load users");
        // }

        // Placeholder: Set empty for now
        setUsers([]);
        setTotal(0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchUsers();
    }
  }, [page, authLoading, isAuthenticated]);

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

  const totalPages = Math.ceil(total / limit);
  const buyersCount = users.filter((u) => u.roles?.buyer).length;
  const sellersCount = users.filter((u) => u.roles?.seller).length;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-maroon to-red text-white shadow-[var(--shadow-lg)] px-(--space-l) py-(--space-m) mb-(--space-l)">
        <div>
          <h1 className="text-3 bold">User Management</h1>
          <p className="text--1 opacity-90">
            View and manage all registered users in the system
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div>
        {/* Stats */}
        <div className="mb-(--space-l)">
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-(--space-m)">
              <div className="text-center">
                <div className="text-2xl font-bold text-maroon">{total}</div>
                <div className="text--1 text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {buyersCount}
                </div>
                <div className="text--1 text-gray-600">Buyers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sellersCount}
                </div>
                <div className="text--1 text-gray-600">Sellers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {
                    users.filter((u) => u.roles?.buyer && u.roles?.seller)
                      .length
                  }
                </div>
                <div className="text--1 text-gray-600">Both Roles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-(--space-m) text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-l) text-center">
            <p className="text-gray-600">
              No users found. API integration pending.
            </p>
            <p className="text--1 text-gray-500 mt-2">
              Connect to{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                /admin/users
              </code>{" "}
              endpoint to display user data.
            </p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {user.roles?.buyer && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                Buyer
                              </span>
                            )}
                            {user.roles?.seller && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                Seller
                              </span>
                            )}
                            {!user.roles?.buyer && !user.roles?.seller && (
                              <span className="text-xs text-gray-500">
                                No roles
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-maroon hover:text-red">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-(--space-s) mt-(--space-l)">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-(--space-m) py-(--space-s) rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="text-0 text-gray-700">
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-(--space-m) py-(--space-s) rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
