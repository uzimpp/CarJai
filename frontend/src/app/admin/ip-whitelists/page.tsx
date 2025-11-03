"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState } from "react";
import { adminAuthAPI } from "@/lib/adminAuth";
import { wouldBlockCurrentSession } from "@/utils/ipUtils";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function IPWhitelistPage() {
  const router = useRouter();
  const {
    ipWhitelist,
    loading,
    isAuthenticated,
    adminSession,
    validateSession,
  } = useAdminAuth();

  const [ipForm, setIpForm] = useState({ ip: "", description: "" });
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);
  const [ipToDelete, setIpToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCurrentIP, setIsCurrentIP] = useState(false);
  const { showToast, ToastContainer } = useToast();

  async function handleAddIP(e: React.FormEvent) {
    e.preventDefault();
    setIpError(null);
    setIpLoading(true);
    try {
      const res = await adminAuthAPI.addIP(
        ipForm.ip.trim(),
        ipForm.description.trim()
      );
      if (!res.success) throw new Error(res.message || "Failed to add IP");
      await validateSession();
      setIpForm({ ip: "", description: "" });
      showToast("IP address added successfully", "success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add IP";
      setIpError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIpLoading(false);
    }
  }

  function handleRemoveIPClick(ip: string) {
    setIpError(null);
    setIpToDelete(ip);
    // Check if this IP is currently being used by the session
    const isCurrent = wouldBlockCurrentSession(ip, adminSession?.ip_address);
    setIsCurrentIP(isCurrent);
    setShowDeleteModal(true);
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setIpToDelete(null);
    setIsCurrentIP(false);
  }

  async function handleConfirmDelete() {
    if (!ipToDelete) return;

    setIpLoading(true);
    setShowDeleteModal(false);
    try {
      const res = await adminAuthAPI.removeIP(ipToDelete);
      if (!res.success) throw new Error(res.message || "Failed to remove IP");
      await validateSession();
      showToast(`IP address ${ipToDelete} removed successfully`, "success");
      setIpToDelete(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove IP";
      setIpError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIpLoading(false);
    }
  }

  useEffect(() => {
    // Only redirect if we're done loading and definitely not authenticated
    if (!loading && isAuthenticated === false) {
      router.push("/admin/signin");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading while authentication is being checked
  if (loading || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center">
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
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* IP Whitelist Information */}
      <div className="">
        <h2 className="text-3 bold text-grey mb-(--space-xs)">
          Allowed IP List ({ipWhitelist.length})
        </h2>
        {/* Add/Remove IP controls */}
        <form
          onSubmit={handleAddIP}
          className="mb-(--space-s) grid grid-cols-1 sm:grid-cols-5 gap-(--space-2xs)"
        >
          <input
            type="text"
            value={ipForm.ip}
            onChange={(e) => setIpForm((f) => ({ ...f, ip: e.target.value }))}
            placeholder="IP address (e.g. 203.0.113.5)"
            className="sm:col-span-2 rounded-full border border-gray-300 px-(--space-s) py-(--space-3xs) text-0 focus:outline-none focus:ring-maroon focus:border-maroon"
            required
          />
          <input
            type="text"
            value={ipForm.description}
            onChange={(e) =>
              setIpForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Description (optional)"
            className="sm:col-span-2 rounded-full border border-gray-300 px-(--space-s) py-(--space-3xs) text-0 focus:outline-none focus:ring-maroon focus:border-maroon"
          />
          <button
            type="submit"
            disabled={ipLoading}
            className="rounded-full bg-maroon hover:bg-red text-white px-(--space-s) py-(--space-3xs) text-0 disabled:opacity-50"
          >
            {ipLoading ? "Adding..." : "Add IP"}
          </button>
        </form>
        {ipError && (
          <div className="text--1 text-red mb-(--space-s)">{ipError}</div>
        )}

        {ipWhitelist.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-50 text--1 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left font-medium">Added On</th>
                  <th className="px-6 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={() => handleRemoveIPClick(ip.ip_address)}
                        className="text--1 px-(--space-3xs) py-(--space-3xs) rounded-full text-red hover:bg-red/10"
                        disabled={ipLoading}
                        aria-label={`Remove ${ip.ip_address}`}
                      >
                        Remove
                      </button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirm Deletion"
        size="md"
      >
        <div className="flex flex-col gap-(--space-m)">
          <p className="text-0 text-gray-600">
            Are you sure you want to remove{" "}
            <span className="font-mono font-semibold text-gray-900">
              {ipToDelete}
            </span>{" "}
            from the whitelist?
          </p>
          {isCurrentIP && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-(--space-s)">
              <div className="flex items-start gap-(--space-xs)">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Warning: This IP range is currently in use
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your current IP address (
                    <span className="font-mono">
                      {adminSession?.ip_address}
                    </span>
                    ) is within this range. Deleting it may lock you out of the
                    admin panel.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-(--space-s) justify-end">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="px-(--space-m) py-(--space-xs) rounded-lg text-0 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={ipLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-(--space-m) py-(--space-xs) rounded-lg text-0 font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={ipLoading}
            >
              {ipLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      {ToastContainer}
    </div>
  );
}
