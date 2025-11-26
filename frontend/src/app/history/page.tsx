"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import CarCard from "@/components/car/CarCard";
import type { CarListing } from "@/types/car";
import { recentAPI } from "@/lib/recentAPI";

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
      setError(null);

      const carListings = await recentAPI.getRecentCarListings(20);

      if (carListings.length > 0) {
        setRecentViews(carListings);
      } else {
        // Empty array means either no views or an error occurred
        // Check if we got an empty response (which is valid) vs an error
        setRecentViews([]);
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
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-maroon mx-auto"></div>
            <p className="mt-4 text-0 text-gray-600 font-medium">
              Loading viewing history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3 font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-0 text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchRecentViews}
              className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="mb-(--space-xl)">
        <h1 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
          Viewing History
        </h1>
        <p className="text-0 text-gray-600">Cars you&apos;ve recently viewed</p>
      </div>

      {recentViews.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h3 className="text-2 font-bold text-gray-900 mb-2">
            No viewing history
          </h3>
          <p className="text-0 text-gray-600 mb-6 max-w-md mx-auto">
            Start browsing cars to see your viewing history here.
          </p>
          <button
            onClick={() => router.push("/browse")}
            className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Browse Cars
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-(--space-m)">
          {recentViews.map((car) => (
            <CarCard key={`rv-${car.id}`} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
