"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { apiCall } from "@/lib/apiCall";
import Image from "next/image";
import Link from "next/link";

interface CarListing {
  cid: number;
  brandName?: string;
  modelName?: string;
  year?: number;
  price: number;
  mileage?: number;
  status: string;
  province?: string;
  color?: string;
  images?: Array<{ id: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function MyListingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "active">("all");

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
          setError(result.message || "Failed to load listings");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
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
            listing.cid === carId ? { ...listing, status: "active" } : listing
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
            listing.cid === carId ? { ...listing, status: "draft" } : listing
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
        setListings((prev) => prev.filter((listing) => listing.cid !== carId));
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
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-(--space-s-m)">
      <div className="max-w-[1400px] mx-auto">
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
                <p className="text-0 text-gray-600 mb-(--space-3xs)">
                  Published
                </p>
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

        {/* Error Message */}
        {error && (
          <div className="mb-(--space-l) p-(--space-m) bg-red-50 border-2 border-red-200 rounded-3xl text-red-700 text-0">
            {error}
          </div>
        )}

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
              <div
                key={listing.cid}
                className="bg-white rounded-4xl shadow-[var(--shadow-lg)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={`/api/cars/images/${listing.images[0].id}`}
                      alt={`${listing.brandName} ${listing.modelName}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl">🚗</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-(--space-s) right-(--space-s)">
                    <span
                      className={`px-(--space-s) py-(--space-xs) rounded-full text--1 bold shadow-md ${
                        listing.status === "active"
                          ? "bg-green-600 text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {listing.status === "active" ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-(--space-l)">
                  <h3 className="text-2 bold text-gray-900 mb-(--space-xs) line-height-11">
                    {listing.brandName || "Unknown"}{" "}
                    {listing.modelName || "Model"}
                  </h3>

                  <div className="flex items-baseline gap-(--space-xs) mb-(--space-m)">
                    <span className="text-3 bold text-maroon">
                      ฿{listing.price ? listing.price.toLocaleString() : "0"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-(--space-xs) mb-(--space-l)">
                    {listing.year && (
                      <div className="flex items-center gap-(--space-xs) text--1 text-gray-600">
                        <span>📅</span>
                        <span>Year: {listing.year}</span>
                      </div>
                    )}
                    {listing.mileage && listing.mileage > 0 && (
                      <div className="flex items-center gap-(--space-xs) text--1 text-gray-600">
                        <span>🛣️</span>
                        <span>
                          Mileage: {listing.mileage.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {listing.province && (
                      <div className="flex items-center gap-(--space-xs) text--1 text-gray-600">
                        <span>📍</span>
                        <span>{listing.province}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-(--space-xs) pt-(--space-s) border-t border-gray-100">
                    {listing.status === "draft" ? (
                      <button
                        onClick={() => handlePublish(listing.cid)}
                        className="flex-1 px-(--space-s) py-(--space-xs) text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:shadow-md transition-all medium text--1"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(listing.cid)}
                        className="flex-1 px-(--space-s) py-(--space-xs) text-orange-700 bg-orange-100 rounded-xl hover:bg-orange-200 transition-all medium text--1"
                      >
                        Unpublish
                      </button>
                    )}
                    <Link
                      href={`/car/${listing.cid}`}
                      className="flex-1 px-(--space-s) py-(--space-xs) text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition-all medium text--1 text-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.cid)}
                      className="px-(--space-s) py-(--space-xs) text-red-700 bg-red-100 rounded-xl hover:bg-red-200 transition-all medium text--1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
