"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { carsAPI } from "@/lib/carsAPI";
import { CarListing } from "@/types/car";
import CarCard from "@/components/car/CarCard";

export default function AdminCarsPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [cars, setCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch cars
  useEffect(() => {
    const fetchCars = async () => {
      if (authLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await carsAPI.search({
          page,
          limit,
        });

        if (result.success && result.data) {
          setCars(result.data.cars);
          setTotal(result.data.total);
        } else {
          setError("Failed to load cars");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchCars();
    }
  }, [page, authLoading, isAuthenticated]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-maroon to-red text-white shadow-[var(--shadow-lg)] px-(--space-l) py-(--space-m) mb-(--space-l)">
        <div>
          <h1 className="text-3 bold">Car Listings Management</h1>
          <p className="text--1 opacity-90">
            View and manage all car listings in the system
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div>
        {/* Stats */}
        <div className="mb-(--space-l)">
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-m)">
              <div className="text-center">
                <div className="text-2xl font-bold text-maroon">{total}</div>
                <div className="text--1 text-gray-600">Total Cars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {cars?.length > 0 ? cars?.filter((c) => c.status === "active").length : 0}
                </div>
                <div className="text--1 text-gray-600">Active Listings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {cars?.length > 0 ? cars?.filter((c) => c.status === "draft").length : 0}
                </div>
                <div className="text--1 text-gray-600">Draft Listings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cars List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cars...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-(--space-m) text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : cars?.length === 0 || cars === null ? (
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-l) text-center">
            <p className="text-gray-600">No cars found in the system</p>
          </div>
        ) : (
          <>
            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-(--space-m) mb-(--space-l)">
              {cars?.map((car) => (
                <CarCard key={car.id} car={car} variant="browse" />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-(--space-s) mb-(--space-l)">
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
