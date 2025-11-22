"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { carsAPI } from "@/lib/carsAPI";
import Link from "next/link";
import { CarListing } from "@/types/car";
import CarCard from "@/components/car/CarCard";
import { useToast } from "@/components/ui/Toast";

export default function MyListingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles, validateSession } =
    useUserAuth();
  const { showToast, ToastContainer } = useToast();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "active" | "sold">(
    "all"
  );

  // If authenticated but roles are missing, try refreshing the session
  useEffect(() => {
    if (isAuthenticated && !isLoading && !roles?.seller) {
      validateSession().catch((error) => {
        console.debug("Session validation error (handled):", error);
      });
    }
  }, [isAuthenticated, isLoading, roles, validateSession]);

  // Redirect logic for seller guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/signin?redirect=/listings");
        return;
      }
      if (roles && !roles.seller) {
        router.push("/signup/role/seller");
        return;
      }
      if (roles && roles.seller && profiles && !profiles.sellerComplete) {
        router.push("/signup/role/seller");
        return;
      }
    }
  }, [isAuthenticated, isLoading, roles, profiles, router]);

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      if (!isAuthenticated || !roles?.seller) return;

      try {
        setIsLoadingListings(true);
        const result = await carsAPI.getMyCars();

        if (result.success && result.data) {
          // Backend returns CarListing[] directly (already in the correct format)
          setListings(result.data);
        }
      } catch {
        // Error handled by state
      } finally {
        setIsLoadingListings(false);
      }
    };

    fetchListings();
  }, [isAuthenticated, roles]);

  const handlePublish = async (carId: number) => {
    try {
      const result = await carsAPI.updateStatus(carId, "active");

      if (result.success) {
        // Update the listing in state
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === carId ? { ...listing, status: "active" } : listing
          )
        );
        showToast("Listing published successfully!", "success");
      } else {
        // Check if result.message contains validation errors
        const errorMessage = result.message || "Failed to publish listing";
        if (errorMessage.includes("Cannot publish car:")) {
          showToast(errorMessage, "error", 8000);
        } else {
          showToast(errorMessage, "error");
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showToast(errorMessage, "error");
    }
  };

  const handleUnpublish = async (carId: number) => {
    try {
      const result = await carsAPI.updateStatus(carId, "draft");

      if (result.success) {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === carId ? { ...listing, status: "draft" } : listing
          )
        );
        showToast("Listing unpublished successfully!", "success");
      } else {
        showToast(result.message || "Failed to unpublish listing", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showToast(errorMessage, "error");
    }
  };

  const handleMarkAsSold = async (carId: number) => {
    try {
      const result = await carsAPI.updateStatus(carId, "sold");

      if (result.success) {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === carId ? { ...listing, status: "sold" } : listing
          )
        );
        showToast("Listing marked as sold successfully!", "success");
      } else {
        showToast(result.message || "Failed to mark listing as sold", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const result = await carsAPI.delete(carId);

      if (result.success) {
        setListings((prev) => prev.filter((listing) => listing.id !== carId));
        showToast("Listing deleted successfully!", "success");
      } else {
        showToast(result.message || "Failed to delete listing", "error");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showToast(errorMessage, "error");
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roles?.seller || !profiles?.sellerComplete) {
    return null;
  }

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    if (filter === "all") return true;
    return listing.status === filter;
  });

  const draftCount = listings.filter((l) => l.status === "draft").length;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const soldCount = listings.filter((l) => l.status === "sold").length;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-(--space-l)">
        <div>
          <h1 className="text-3 bold">My Listings</h1>
        </div>
        <Link
          href="/sell"
          className="p-(--space-s) aspect-square text-white bg-maroon hover:bg-red rounded-full transition-colors flex items-center justify-center"
        >
          <div className="flex items-center justify-center text-3 aspect-square w-full h-full">
            +
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-(--space-m) mb-(--space-l)">
        <button
          type="button"
          className={`rounded-3xl shadow-sm p-(--space-s) transition-colors ${
            filter === "all"
              ? "bg-purple-950 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setFilter("all")}
        >
          <div className="flex items-center justify-end flex-row-reverse w-full gap-(--space-xs-s)">
            <div className="flex flex-col justify-start w-full">
              <p
                className={`flex text--1 pb-auto line-height-1 ${
                  filter === "all" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Total Listings
              </p>
              <p
                className={`flex text-2 font-bold line-clamp-2 ${
                  filter === "all" ? "text-white" : "text-black"
                }`}
              >
                {listings.length}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                filter === "all" ? "bg-purple-500/90" : "bg-purple-100"
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  filter === "all" ? "text-white" : "text-purple-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`rounded-3xl shadow-sm p-(--space-s) transition-colors ${
            filter === "active"
              ? "bg-green-950 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setFilter("active")}
        >
          <div className="flex items-center justify-end flex-row-reverse w-full gap-(--space-xs-s)">
            <div className="flex flex-col justify-start w-full">
              <p
                className={`flex text--1 pb-auto line-height-1 ${
                  filter === "active" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Published
              </p>
              <p
                className={`flex text-2 font-bold line-clamp-2 ${
                  filter === "active" ? "text-white" : "text-black"
                }`}
              >
                {activeCount}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                filter === "active" ? "bg-green-500/90" : "bg-green-100"
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  filter === "active" ? "text-white" : "text-green-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`rounded-3xl shadow-sm p-(--space-s) transition-colors ${
            filter === "draft"
              ? "bg-orange-950 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setFilter("draft")}
        >
          <div className="flex items-center justify-end flex-row-reverse w-full gap-(--space-xs-s)">
            <div className="flex flex-col justify-start w-full">
              <p
                className={`flex text--1 pb-auto line-height-1 ${
                  filter === "draft" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Drafts
              </p>
              <p
                className={`flex text-2 font-bold line-clamp-2 ${
                  filter === "draft" ? "text-white" : "text-black"
                }`}
              >
                {draftCount}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                filter === "draft" ? "bg-orange-500/90" : "bg-orange-100"
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  filter === "draft" ? "text-white" : "text-orange-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
          </div>
        </button>

        <button
          type="button"
          className={`rounded-3xl shadow-sm p-(--space-s) transition-colors ${
            filter === "sold" ? "bg-blue-950 text-white" : "bg-white text-black"
          }`}
          onClick={() => setFilter("sold")}
        >
          <div className="flex items-center justify-end flex-row-reverse w-full gap-(--space-xs-s)">
            <div className="flex flex-col justify-start w-full">
              <p
                className={`flex text--1 pb-auto line-height-1 ${
                  filter === "sold" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Sold
              </p>
              <p
                className={`flex text-2 font-bold line-clamp-2 ${
                  filter === "sold" ? "text-white" : "text-black"
                }`}
              >
                {soldCount}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                filter === "sold" ? "bg-blue-500/90" : "bg-blue-100"
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  filter === "sold" ? "text-white" : "text-blue-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12.75L11.182 15l5.318-5.318M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21a3.745 3.745 0 01-3.068-1.593 3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Listings Grid */}
      {isLoadingListings ? (
        <div className="bg-white rounded-3xl shadow-sm">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
              <p className="text-gray-600">Loading listings...</p>
            </div>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm">
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
            <h2 className="text-lg font-semibold text-black mb-2">
              No Listings Found
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "You haven't created any listings yet."
                : filter === "active"
                ? "You don't have any published listings."
                : filter === "draft"
                ? "You don't have any draft listings."
                : "You don't have any sold listings."}
            </p>
            {/* <Link
              href="/sell"
              className="inline-block px-6 py-2 text-white bg-maroon hover:bg-red rounded-lg transition-colors font-medium"
            >
              Create Your First Listing
            </Link> */}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-(--space-l)">
          {filteredListings.map((listing) => (
            <CarCard
              key={listing.id}
              car={listing}
              variant="listing"
              actions={{
                onDelete: (id) => handleDelete(id),
                onPublish: (id) => handlePublish(id),
                onUnpublish: (id) => handleUnpublish(id),
                onMarkAsSold: (id) => handleMarkAsSold(id),
              }}
            />
          ))}
        </div>
      )}
      {ToastContainer}
    </div>
  );
}
