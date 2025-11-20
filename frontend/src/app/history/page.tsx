"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import CarCard from "@/components/car/CarCard";
import type { CarListing } from "@/types/car";
import { apiCall } from "@/lib/apiCall";

interface CarListItemListResponse {
  success: boolean;
  data: CarListing[];
  message?: string;
}

export default function HistoryPage() {
  const [recentViews, setRecentViews] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, roles, isLoading: authLoading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
      return;
    }

    // Only buyers can access viewing history
    if (!authLoading && user && !roles?.buyer) {
      setError("Viewing history is available for buyers only.");
      return;
    }

    if (user && roles?.buyer) {
      fetchRecentViews();
    }
  }, [user, roles, authLoading, router]);

  const fetchRecentViews = async () => {
    try {
      setLoading(true);
      const response = await apiCall<CarListItemListResponse>(
        "/api/recent-views",
        {
          method: "GET",
        }
      );

      if (response.success) {
        // Backend now returns complete CarListItem objects with all data including thumbnailUrl
        // No need for additional API calls or data enrichment
        setRecentViews(response.data);
      } else {
        setError(response.message || "Failed to fetch viewing history");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (
        msg.includes("not authenticated") ||
        msg.includes("unauthorized") ||
        msg.includes("401")
      ) {
        setError("Please sign in to view your viewing history.");
      } else if (msg.includes("forbidden") || msg.includes("403")) {
        setError("Viewing history is available for buyers only.");
      } else {
        setError("Failed to fetch viewing history");
      }
      console.warn("Error fetching recent views:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecentViews}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-(--space-xl)">
      <div className="max-w-[1200px] mx-auto px-(--space-m)">
        <div className="mb-(--space-l)">
          <h1 className="text-3 font-bold text-gray-900 mb-(--space-xs)">
            Viewing History
          </h1>
          <p className="text-0 text-gray-600">
            Cars you&apos;ve recently viewed
          </p>
        </div>

        {recentViews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No viewing history
            </h3>
            <p className="text-gray-500 mb-6">
              Start browsing cars to see your viewing history here.
            </p>
            <button
              onClick={() => router.push("/browse")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-(--space-m)">
            {recentViews.map((car) => (
              <CarCard key={`rv-${car.id}`} car={car} variant="browse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
