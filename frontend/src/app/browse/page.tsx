"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { carsAPI } from "@/lib/carsAPI";
import { favoritesAPI } from "@/lib/favoritesAPI";
import SearchFilters, {
  type SearchFiltersData,
} from "@/components/search/SearchFilters";
import { CarListing } from "@/types/car";
import type { SearchCarsParams } from "@/types/search";
import CarCard from "@/components/car/CarCard";
import { useUserAuth } from "@/hooks/useUserAuth";

const isArrayEqual = (a?: string[], b?: string[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const areFiltersEqual = (
  a: SearchFiltersData,
  b: SearchFiltersData
): boolean => {
  const keys = new Set([
    ...(Object.keys(a) as Array<keyof SearchFiltersData>),
    ...(Object.keys(b) as Array<keyof SearchFiltersData>),
  ]);

  for (const key of keys) {
    const valueA = a[key];
    const valueB = b[key];

    if (Array.isArray(valueA) || Array.isArray(valueB)) {
      if (
        !isArrayEqual(
          valueA as string[] | undefined,
          valueB as string[] | undefined
        )
      )
        return false;
      continue;
    }

    if (valueA !== valueB) {
      return false;
    }
  }

  return true;
};

const omitFilterKey = (
  filters: SearchFiltersData,
  key: keyof SearchFiltersData
): SearchFiltersData => {
  if (!(key in filters)) {
    return filters;
  }

  const nextFilters = { ...filters } as Record<string, unknown>;
  delete nextFilters[key as string];
  return nextFilters as SearchFiltersData;
};

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams
): SearchFiltersData => {
  const nextFilters: SearchFiltersData = {};

  const q = searchParams.get("q");
  if (q) {
    nextFilters.search = q;
  }

  const minPrice = parseNumber(searchParams.get("minPrice"));
  if (minPrice !== undefined) nextFilters.minPrice = minPrice;

  const maxPrice = parseNumber(searchParams.get("maxPrice"));
  if (maxPrice !== undefined) nextFilters.maxPrice = maxPrice;

  const minYear = parseNumber(searchParams.get("minYear"));
  if (minYear !== undefined) nextFilters.minYear = minYear;

  const maxYear = parseNumber(searchParams.get("maxYear"));
  if (maxYear !== undefined) nextFilters.maxYear = maxYear;

  const minMileage = parseNumber(searchParams.get("minMileage"));
  if (minMileage !== undefined) nextFilters.minMileage = minMileage;

  const maxMileage = parseNumber(searchParams.get("maxMileage"));
  if (maxMileage !== undefined) nextFilters.maxMileage = maxMileage;

  const bodyType = searchParams.get("bodyType");
  if (bodyType) nextFilters.bodyType = bodyType;

  const transmissions = searchParams.getAll("transmission");
  if (transmissions.length > 0) nextFilters.transmission = transmissions;

  const drivetrains = searchParams.getAll("drivetrain");
  if (drivetrains.length > 0) nextFilters.drivetrain = drivetrains;

  const provinceId = parseNumber(searchParams.get("provinceId"));
  if (provinceId !== undefined) nextFilters.provinceId = provinceId;

  const fuelTypes = searchParams.getAll("fuelTypes");
  if (fuelTypes.length > 0) nextFilters.fuelTypes = fuelTypes;

  const colors = searchParams.getAll("colors");
  if (colors.length > 0) nextFilters.colors = colors;

  return nextFilters;
};

const parsePageFromSearchParams = (searchParams: URLSearchParams): number => {
  const pageParam = parseNumber(searchParams.get("page"));
  return pageParam && pageParam > 0 ? pageParam : 1;
};

const buildSearchParams = (
  filters: SearchFiltersData,
  page: number
): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("q", filters.search);
  }
  if (filters.minPrice !== undefined)
    params.set("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined)
    params.set("maxPrice", filters.maxPrice.toString());
  if (filters.minYear !== undefined)
    params.set("minYear", filters.minYear.toString());
  if (filters.maxYear !== undefined)
    params.set("maxYear", filters.maxYear.toString());
  if (filters.minMileage !== undefined)
    params.set("minMileage", filters.minMileage.toString());
  if (filters.maxMileage !== undefined)
    params.set("maxMileage", filters.maxMileage.toString());
  if (filters.bodyType) params.set("bodyType", filters.bodyType);
  if (filters.transmission && filters.transmission.length > 0) {
    filters.transmission.forEach((t) => params.append("transmission", t));
  }
  if (filters.drivetrain && filters.drivetrain.length > 0) {
    filters.drivetrain.forEach((d) => params.append("drivetrain", d));
  }
  if (filters.provinceId !== undefined)
    params.set("provinceId", filters.provinceId.toString());
  if (filters.fuelTypes && filters.fuelTypes.length > 0) {
    filters.fuelTypes.forEach((fuel) => params.append("fuelTypes", fuel));
  }
  if (filters.colors && filters.colors.length > 0) {
    filters.colors.forEach((color) => params.append("colors", color));
  }
  if (page > 1) params.set("page", page.toString());

  return params;
};

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const initialPage = useMemo(
    () => parsePageFromSearchParams(searchParams),
    [searchParams]
  );

  const [cars, setCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<SearchFiltersData>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [favoriteCarIds, setFavoriteCarIds] = useState<Set<number>>(new Set());

  const { isAuthenticated, roles } = useUserAuth();
  const isBuyer = isAuthenticated && roles?.buyer;

  const syncRoute = useCallback(
    (nextFilters: SearchFiltersData, nextPage: number) => {
      const params = buildSearchParams(nextFilters, nextPage);
      const queryString = params.toString();
      router.replace(queryString ? `/browse?${queryString}` : "/browse", {
        scroll: false,
      });
    },
    [router]
  );

  const applyFilters = useCallback(
    (nextFilters: SearchFiltersData, options: { page?: number } = {}) => {
      const pageToUse = options.page ?? 1;

      setFilters(nextFilters);
      setPage(pageToUse);
      setSearchInput(nextFilters.search ?? "");
      setError("");

      syncRoute(nextFilters, pageToUse);
    },
    [syncRoute]
  );

  // Fetch cars
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setIsLoading(true);
        setError("");
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
        if (filters.minMileage) params.minMileage = filters.minMileage;
        if (filters.maxMileage) params.maxMileage = filters.maxMileage;
        if (filters.bodyType) params.bodyType = filters.bodyType;
        if (filters.transmission) params.transmission = filters.transmission;
        if (filters.drivetrain) params.drivetrain = filters.drivetrain;
        if (filters.fuelTypes && filters.fuelTypes.length > 0)
          params.fuelTypes = filters.fuelTypes;
        if (filters.colors && filters.colors.length > 0)
          params.colors = filters.colors;
        if (filters.provinceId) params.provinceId = filters.provinceId;

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

  // Fetch user's favorites when they're authenticated as a buyer
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isBuyer) return;

      try {
        const favoritesCars = await favoritesAPI.getFavorites();
        const favoriteIds = new Set(
          favoritesCars.map((car: CarListing) => car.id)
        );
        setFavoriteCarIds(favoriteIds);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    };

    fetchFavorites();
  }, [isBuyer]);

  const handleFavoriteToggle = async (carId: number, isFavorited: boolean) => {
    // Update local state immediately for optimistic UI
    setFavoriteCarIds((prev) => {
      const newSet = new Set(prev);
      if (isFavorited) {
        newSet.add(carId);
      } else {
        newSet.delete(carId);
      }
      return newSet;
    });
  };

  const handleFiltersChange = (newFilters: SearchFiltersData) => {
    applyFilters(newFilters);
  };

  useEffect(() => {
    const nextFilters = parseFiltersFromSearchParams(searchParams);
    const nextPage = parsePageFromSearchParams(searchParams);

    setFilters((current) => {
      if (areFiltersEqual(current, nextFilters)) {
        return current;
      }
      const q = searchParams.get("q");
      if (q) {
        setSearchInput(q);
      } else {
        setSearchInput("");
      }
      return nextFilters;
    });

    setPage((current) => (current === nextPage ? current : nextPage));
  }, [searchParams, router]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    const nextFilters =
      trimmed.length > 0
        ? { ...filters, search: trimmed }
        : omitFilterKey(filters, "search");
    applyFilters(nextFilters);
  };

  const goToPage = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    syncRoute(filters, nextPage);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters
            filters={filters}
            searchInput={searchInput}
            onFiltersChange={handleFiltersChange}
            onSearchSubmit={handleSearchSubmit}
            onSearchInputChange={(value) => setSearchInput(value)}
          />
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
                  <CarCard
                    key={car.id}
                    car={car}
                    variant="browse"
                    showFavorite={isBuyer}
                    isFavorited={favoriteCarIds.has(car.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    showCompare={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
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

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading cars...</p>
            </div>
          </div>
        </div>
      }
    >
      <BrowsePageContent />
    </Suspense>
  );
}
