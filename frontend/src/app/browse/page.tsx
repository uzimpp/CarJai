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
import SearchFilters, {
  type SearchFiltersData,
  type CategoryValue,
  type CategoryOption,
} from "@/components/search/SearchFilters";
import { CarListing } from "@/types/car";
import type { SearchCarsParams } from "@/types/search";
import CarCard from "@/components/car/CarCard";

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "all", label: "All" },
  { value: "electric", label: "Electric", fuelTypes: ["ELECTRIC"] },
  { value: "sport", label: "Sport", bodyType: "SPORTLUX" },
  { value: "family", label: "Family", bodyType: "SUV" },
  { value: "compact", label: "Compact", bodyType: "CITYCAR" },
];

const isArrayEqual = (a?: string[], b?: string[]) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const areFiltersEqual = (a: SearchFiltersData, b: SearchFiltersData): boolean => {
  const keys = new Set(
    [
      ...(Object.keys(a) as Array<keyof SearchFiltersData>),
      ...(Object.keys(b) as Array<keyof SearchFiltersData>),
    ]
  );

  for (const key of keys) {
    const valueA = a[key];
    const valueB = b[key];

    if (Array.isArray(valueA) || Array.isArray(valueB)) {
      if (!isArrayEqual(valueA as string[] | undefined, valueB as string[] | undefined))
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

const isCategoryQuery = (query: string): CategoryValue | null => {
  const normalized = query.trim().toLowerCase();
  const matched = CATEGORY_OPTIONS.find(
    (option) => option.value !== "all" && option.value.toLowerCase() === normalized
  );
  return matched ? matched.value : null;
};

const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams
): SearchFiltersData => {
  const nextFilters: SearchFiltersData = {};

  const q = searchParams.get("q");
  // Only set search if q is not a category keyword
  if (q && !isCategoryQuery(q)) {
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

  const maxMileage = parseNumber(searchParams.get("maxMileage"));
  if (maxMileage !== undefined) nextFilters.maxMileage = maxMileage;

  const bodyType = searchParams.get("bodyType");
  if (bodyType) nextFilters.bodyType = bodyType;

  const transmission = searchParams.get("transmission");
  if (transmission) nextFilters.transmission = transmission;

  const drivetrain = searchParams.get("drivetrain");
  if (drivetrain) nextFilters.drivetrain = drivetrain;

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

const inferCategoryFromFilters = (filters: SearchFiltersData): CategoryValue => {
  // Check for electric category (fuelTypes includes ELECTRIC)
  if (filters.fuelTypes?.includes("ELECTRIC")) {
    return "electric";
  }
  
  // Check for sport category (bodyType is SPORTLUX)
  if (filters.bodyType === "SPORTLUX") {
    return "sport";
  }
  
  // Check for family category (bodyType is SUV)
  if (filters.bodyType === "SUV") {
    return "family";
  }
  
  // Check for compact category (bodyType is CITYCAR)
  if (filters.bodyType === "CITYCAR") {
    return "compact";
  }
  
  return "all";
};

const parseCategoryFromSearchParams = (
  searchParams: URLSearchParams,
  filters: SearchFiltersData
): CategoryValue => {
  // Check explicit category parameter first
  const categoryParam = searchParams.get("category");
  if (categoryParam) {
    const matched = CATEGORY_OPTIONS.find(
      (option) => option.value === categoryParam
    );
    if (matched) {
      return matched.value;
    }
  }
  
  // Check if q parameter is a category keyword
  const q = searchParams.get("q");
  if (q) {
    const categoryFromQ = isCategoryQuery(q);
    if (categoryFromQ) {
      return categoryFromQ;
    }
  }
  
  return inferCategoryFromFilters(filters);
};

const buildSearchParams = (
  filters: SearchFiltersData,
  page: number,
  category: CategoryValue
): URLSearchParams => {
  const params = new URLSearchParams();

  // Only add q parameter if it's not a category keyword
  if (filters.search && !isCategoryQuery(filters.search)) {
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
  if (filters.maxMileage !== undefined)
    params.set("maxMileage", filters.maxMileage.toString());
  if (filters.bodyType) params.set("bodyType", filters.bodyType);
  if (filters.transmission) params.set("transmission", filters.transmission);
  if (filters.drivetrain) params.set("drivetrain", filters.drivetrain);
  if (filters.provinceId !== undefined)
    params.set("provinceId", filters.provinceId.toString());
  if (filters.fuelTypes && filters.fuelTypes.length > 0) {
    filters.fuelTypes.forEach((fuel) => params.append("fuelTypes", fuel));
  }
  if (filters.colors && filters.colors.length > 0) {
    filters.colors.forEach((color) => params.append("colors", color));
  }
  if (category !== "all") params.set("category", category);
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
  const initialCategory = useMemo(
    () => parseCategoryFromSearchParams(searchParams, initialFilters),
    [searchParams, initialFilters]
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
  const [category, setCategory] = useState<CategoryValue>(initialCategory);
  const [searchInput, setSearchInput] = useState("");

  const syncRoute = useCallback(
    (nextFilters: SearchFiltersData, nextPage: number, nextCategory: CategoryValue) => {
      const params = buildSearchParams(nextFilters, nextPage, nextCategory);
      const queryString = params.toString();
      router.replace(queryString ? `/browse?${queryString}` : "/browse", {
        scroll: false,
      });
    },
    [router]
  );

  const applyFilters = useCallback(
    (
      nextFilters: SearchFiltersData,
      options: { category?: CategoryValue; page?: number } = {}
    ) => {
      const categoryToUse =
        options.category ?? inferCategoryFromFilters(nextFilters);
      const pageToUse = options.page ?? 1;

      setFilters(nextFilters);
      setCategory(categoryToUse);
      setPage(pageToUse);
      setSearchInput(nextFilters.search ?? "");
      setError("");

      syncRoute(nextFilters, pageToUse, categoryToUse);
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

  const handleFiltersChange = (newFilters: SearchFiltersData) => {
    applyFilters(newFilters);
  };

  useEffect(() => {
    const q = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    
    // Redirect if q is a category keyword and not already redirected
    if (q && !categoryParam) {
      const categoryFromQ = isCategoryQuery(q);
      if (categoryFromQ && categoryFromQ !== "all") {
        const categoryOption = CATEGORY_OPTIONS.find(
          (opt) => opt.value === categoryFromQ
        );
        if (categoryOption) {
          const redirectParams = new URLSearchParams();
          redirectParams.set("category", categoryFromQ);
          if (categoryOption.fuelTypes) {
            categoryOption.fuelTypes.forEach((fuel) =>
              redirectParams.append("fuelTypes", fuel)
            );
          }
          if (categoryOption.bodyType) {
            redirectParams.set("bodyType", categoryOption.bodyType);
          }
          router.replace(`/browse?${redirectParams.toString()}`, {
            scroll: false,
          });
          return;
        }
      }
    }

    const nextFilters = parseFiltersFromSearchParams(searchParams);
    const nextCategory = parseCategoryFromSearchParams(
      searchParams,
      nextFilters
    );
    const nextPage = parsePageFromSearchParams(searchParams);

    setFilters((current) => {
      if (areFiltersEqual(current, nextFilters)) {
        return current;
      }
      // Only set search input if q is not a category keyword
      const q = searchParams.get("q");
      if (q && !isCategoryQuery(q)) {
        setSearchInput(q);
      } else {
        setSearchInput("");
      }
      return nextFilters;
    });

    setCategory((current) =>
      current === nextCategory ? current : nextCategory
    );

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

  const handleCategoryChange = (value: CategoryValue) => {
    const selectedOption = CATEGORY_OPTIONS.find(
      (option) => option.value === value
    );
    const prevOption = CATEGORY_OPTIONS.find(
      (option) => option.value === category
    );

    const nextFilters = { ...filters };

    // Remove previous category-specific filters
    if (prevOption && category !== "all") {
      if (prevOption.fuelTypes) {
        const newFuelTypes = nextFilters.fuelTypes?.filter(
          (f) => !prevOption.fuelTypes?.includes(f)
        );
        nextFilters.fuelTypes =
          newFuelTypes && newFuelTypes.length > 0 ? newFuelTypes : undefined;
      }
      if (prevOption.bodyType && nextFilters.bodyType === prevOption.bodyType) {
        delete nextFilters.bodyType;
      }
    }

    // Apply new category filters
    if (value === "all") {
      // No additional filters needed for "all"
    } else if (selectedOption) {
      if (selectedOption.fuelTypes) {
        const currentFuels = nextFilters.fuelTypes || [];
        const newFuels = [
          ...currentFuels.filter((f) => !selectedOption.fuelTypes?.includes(f)),
          ...selectedOption.fuelTypes,
        ];
        nextFilters.fuelTypes = newFuels;
      }
      if (selectedOption.bodyType) {
        nextFilters.bodyType = selectedOption.bodyType;
      }
    }

    applyFilters(nextFilters, { category: value });
  };

  const goToPage = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    syncRoute(filters, nextPage, category);
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
          <SearchFilters
            filters={filters}
            searchInput={searchInput}
            category={category}
            categoryOptions={CATEGORY_OPTIONS}
            onFiltersChange={handleFiltersChange}
            onSearchSubmit={handleSearchSubmit}
            onSearchInputChange={(value) => setSearchInput(value)}
            onCategoryChange={handleCategoryChange}
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
                    <CarCard key={car.id} car={car} variant="browse" />
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
