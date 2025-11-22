"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState } from "react";
import { adminAPI } from "@/lib/adminAPI";
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
  const [ipToDelete, setIpToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isCurrentIP, setIsCurrentIP] = useState(false);
  const { showToast, ToastContainer } = useToast();

  async function handleAddIP(e: React.FormEvent) {
    e.preventDefault();
    setIpLoading(true);
    try {
      const res = await adminAPI.addIP(
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
      showToast(errorMessage, "error");
    } finally {
      setIpLoading(false);
    }
  }

  async function handleRemoveIPClick(ip: string) {
    setIpToDelete(ip);
    setIsCurrentIP(false); // Reset warning state
    setIpLoading(true);

    try {
      // Check with backend if deletion would affect current session
      const checkRes = await adminAPI.checkIPDeletionImpact(ip);
      // Extract wouldBlockSession from the data object
      const impactData = checkRes.data as
        | { wouldBlockSession?: boolean }
        | undefined;
      const wouldBlock = impactData?.wouldBlockSession === true;
      setIsCurrentIP(wouldBlock);
      console.log("IP deletion check:", { ip, wouldBlock, response: checkRes });
    } catch (err) {
      // If check fails, default to false (don't show warning)
      console.error("Failed to check IP deletion impact:", err);
      setIsCurrentIP(false);
    } finally {
      setIpLoading(false);
      setShowDeleteModal(true);
    }
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
      const res = await adminAPI.removeIP(ipToDelete);
      if (!res.success) throw new Error(res.message || "Failed to remove IP");
      await validateSession();
      showToast(`IP address ${ipToDelete} removed successfully`, "success");
      setIpToDelete(null);
      setIsCurrentIP(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove IP";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
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
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Header */}
      <div>
        <h1 className="text-3 bold">IP Whitelist Management</h1>
      </div>

      {/* Add IP Form */}
      <div className="bg-white rounded-3xl shadow-sm p-(--space-m)">
        <h2 className="text-2 font-bold text-gray-900 mb-(--space-m)">
          Add IP Address
        </h2>
        <form onSubmit={handleAddIP}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-s)">
            <div>
              <label
                htmlFor="ip"
                className="block text-0 font-medium text-gray-700 mb-1"
              >
                IP Address
              </label>
              <input
                id="ip"
                type="text"
                value={ipForm.ip}
                onChange={(e) =>
                  setIpForm((f) => ({ ...f, ip: e.target.value }))
                }
                placeholder="0.0.0.0"
                className="w-full rounded-lg font-mono border border-gray-300 px-(--space-s) py-(--space-xs) text-sm focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-0 font-medium text-gray-700 mb-1"
              >
                Description{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="description"
                type="text"
                value={ipForm.description}
                onChange={(e) =>
                  setIpForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Admin IP Address for "
                className="w-full rounded-lg border border-gray-300 px-(--space-s) py-(--space-xs) text-sm focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-0 font-medium text-gray-700 mb-1 opacity-0 pointer-events-none">
                Action
              </label>
              <button
                type="submit"
                disabled={ipLoading}
                className="rounded-lg bg-maroon hover:bg-red-700 text-white px-(--space-m) py-(--space-xs) text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {ipLoading ? "Adding..." : "Add IP"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* IP List */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden p-(--space-m)">
        <div className="pb-(--space-s) border-b border-gray-200">
          <h2 className="text-2 font-bold text-gray-900">
            Allowed IP List ({ipWhitelist.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 ">
          {/* Column Headers - Hidden on mobile, visible on md+ */}
          <div className="hidden md:grid md:grid-cols-[1fr_2fr_80px] lg:grid-cols-[1fr_2fr_1.5fr_80px] gap-(--space-2xs) p-(--space-2xs) bg-gray-50 rounded-t-lg">
            <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </div>
            <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
              Description
            </div>
            <div className="text--1 font-medium text-gray-500 uppercase tracking-wider hidden lg:block">
              Date
            </div>
            <div className="text--1 font-medium text-gray-500 uppercase tracking-wider flex justify-center">
              Actions
            </div>
          </div>
          {ipWhitelist.length > 0 ? (
            <>
              {ipWhitelist.map((ip) => (
                <div
                  key={ip.id}
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_2fr_80px] lg:grid-cols-[1fr_2fr_1.5fr_80px] gap-(--space-2xs) p-(--space-2xs) transition-colors items-center"
                >
                  {/* IP Address & Description (Mobile) / IP Address only (Desktop) */}
                  <div className="flex flex-col gap-(--space-3xs)">
                    <div className="text--1 font-mono text-gray-900 font-medium">
                      {ip.ip_address}
                    </div>
                    {/* Description on mobile - only show if exists */}
                    {ip.description && (
                      <div className="text--1 text-gray-500 md:hidden">
                        {ip.description}
                      </div>
                    )}
                  </div>

                  {/* Description - hidden on mobile, visible on md+ */}
                  <div className="hidden md:block text--1 text-gray-900 truncate">
                    {ip.description || (
                      <span className="text-gray-400 italic">
                        No description
                      </span>
                    )}
                  </div>

                  {/* Added On - hidden on mobile and tablet, visible on lg+ */}
                  <div className="hidden lg:block text--1 text-gray-500 font-mono">
                    {new Date(ip.created_at).toLocaleString()}
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => handleRemoveIPClick(ip.ip_address)}
                    className="justify-self-center p-(--space-2xs) rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={ipLoading}
                    aria-label={`Remove ${ip.ip_address}`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.4}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-gray-600 text-lg font-medium">
                No IP addresses whitelisted
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Add IP addresses above to allow admin access
              </p>
            </div>
          )}
        </div>
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
          <div className="flex gap-(--space-s) justify-center">
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
