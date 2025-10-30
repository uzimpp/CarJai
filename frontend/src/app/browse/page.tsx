"use client";

import { useEffect, useState } from "react";
import { carsAPI } from "@/lib/carsAPI";
import SearchFilters, {
  SearchFiltersData,
} from "@/components/search/SearchFilters";
import { CarListing } from "@/types/car";
import type { SearchCarsParams } from "@/types/search";
import CarCard from "@/components/car/CarCard";

export default function BrowsePage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFiltersData>({});

  // Fetch cars
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setIsLoading(true);
        const params: SearchCarsParams = {
          q: filters.search,
          page,
          limit: 12,
        };

        // Add filters
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.minYear) params.minYear = filters.minYear;
        if (filters.maxYear) params.maxYear = filters.maxYear;

        const result = await carsAPI.search(params);

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

    fetchCars();
  }, [filters, page]);

  const handleFiltersChange = (newFilters: SearchFiltersData) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Cars</h1>
        <p className="text-lg text-gray-600">
          Find your perfect car from thousands of listings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results Header */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {total} {total === 1 ? "car" : "cars"} found
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">
                  Loading cars...
                </p>
              </div>
            </div>
          ) : !cars || cars.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <span className="text-5xl">🚗</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Cars Found
              </h2>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <>
              {/* Car Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {cars.map((car) => (
                    <CarCard key={car.id} car={car} variant="browse" />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
