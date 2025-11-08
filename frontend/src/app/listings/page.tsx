"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiCall } from "@/lib/apiCall";
import Link from "next/link";
import { CarListing } from "@/types/car";
import CarCard from "@/components/car/CarCard";

export default function MyListingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles, validateSession } =
    useUserAuth();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "active">("all");

  // If authenticated but roles are missing, try refreshing the session
  useEffect(() => {
    if (isAuthenticated && !isLoading && !roles?.seller) {
      validateSession();
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
        const result = await apiCall<{
          success: boolean;
          data: CarListing[];
          message?: string;
        }>("/api/cars/my", {
          method: "GET",
        });

        if (result.success && result.data) {
          setListings(result.data);
        } else {
        }
      } catch {
      } finally {
        setIsLoadingListings(false);
      }
    };

    fetchListings();
  }, [isAuthenticated, roles]);

  const handlePublish = async (carId: number) => {
    try {
      const result = await apiCall<{ success: boolean; message?: string }>(
        `/api/cars/${carId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        }
      );

      if (result.success) {
        // Update the listing in state
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === carId ? { ...listing, status: "active" } : listing
          )
        );
        alert("Listing published successfully!");
      } else {
        alert(result.message || "Failed to publish listing");
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleUnpublish = async (carId: number) => {
    try {
      const result = await apiCall<{ success: boolean; message?: string }>(
        `/api/cars/${carId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "draft" }),
        }
      );

      if (result.success) {
        setListings((prev) =>
          prev.map((listing) =>
            listing.id === carId ? { ...listing, status: "draft" } : listing
          )
        );
        alert("Listing unpublished successfully!");
      } else {
        alert(result.message || "Failed to unpublish listing");
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const result = await apiCall<{ success: boolean; message?: string }>(
        `/api/cars/${carId}`,
        {
          method: "DELETE",
        }
      );

      if (result.success) {
        setListings((prev) => prev.filter((listing) => listing.id !== carId));
        alert("Listing deleted successfully!");
      } else {
        alert(result.message || "Failed to delete listing");
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
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

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="mb-(--space-xl)">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5 bold text-gray-900 mb-(--space-2xs) line-height-11">
              My Listings
            </h1>
            <p className="text-1 text-gray-600 line-height-12">
              Manage your car listings and track their status
            </p>
          </div>
          <Link
            href="/sell"
            className="px-(--space-l) py-(--space-s) text-white bg-gradient-to-r from-maroon to-red rounded-3xl hover:shadow-lg transition-all bold text-0 shadow-md"
          >
            + Add New Listing
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-m) mb-(--space-xl)">
        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-l) border-2 border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-0 text-gray-600 mb-(--space-3xs)">
                Total Listings
              </p>
              <p className="text-4 bold text-gray-900">{listings.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-l) border-2 border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-0 text-gray-600 mb-(--space-3xs)">Published</p>
              <p className="text-4 bold text-green-600">{activeCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-l) border-2 border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-0 text-gray-600 mb-(--space-3xs)">Drafts</p>
              <p className="text-4 bold text-orange-600">{draftCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-xs) mb-(--space-l) inline-flex gap-(--space-xs)">
        <button
          onClick={() => setFilter("all")}
          className={`px-(--space-l) py-(--space-s) rounded-2xl transition-all medium text-0 ${
            filter === "all"
              ? "bg-gradient-to-r from-maroon to-red text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All ({listings.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-(--space-l) py-(--space-s) rounded-2xl transition-all medium text-0 ${
            filter === "active"
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Published ({activeCount})
        </button>
        <button
          onClick={() => setFilter("draft")}
          className={`px-(--space-l) py-(--space-s) rounded-2xl transition-all medium text-0 ${
            filter === "draft"
              ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Drafts ({draftCount})
        </button>
      </div>

      {/* Listings Grid */}
      {isLoadingListings ? (
        <div className="flex items-center justify-center py-(--space-3xl)">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon mx-auto"></div>
            <p className="mt-(--space-m) text-gray-600 medium text-1">
              Loading listings...
            </p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-(--space-3xl)">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-(--space-l)">
            <span className="text-5xl">🚗</span>
          </div>
          <h2 className="text-3 bold text-gray-900 mb-(--space-s)">
            No Listings Found
          </h2>
          <p className="text-1 text-gray-600 mb-(--space-l)">
            {filter === "all"
              ? "You haven't created any listings yet."
              : filter === "active"
              ? "You don't have any published listings."
              : "You don't have any draft listings."}
          </p>
          <Link
            href="/sell"
            className="inline-block px-(--space-xl) py-(--space-m) text-white bg-gradient-to-r from-maroon to-red rounded-3xl hover:shadow-xl transition-all bold text-1 shadow-lg"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-(--space-l)">
          {filteredListings.map((listing) => (
            <CarCard
              key={listing.id}
              car={listing}
              variant="listing"
              showActions
              onDelete={(id) => handleDelete(id)}
              onPublish={(id) => handlePublish(id)}
              onUnpublish={(id) => handleUnpublish(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
