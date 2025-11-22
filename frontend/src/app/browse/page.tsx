"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { referenceAPI } from "@/lib/referenceAPI";
import PaginateControl from "@/components/ui/PaginateControl";

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

  const conditionRating = parseNumber(searchParams.get("conditionRating"));
  if (conditionRating !== undefined)
    nextFilters.conditionRating = conditionRating;

  return nextFilters;
};

const parsePageFromSearchParams = (searchParams: URLSearchParams): number => {
  const pageParam = parseNumber(searchParams.get("page"));
  return pageParam && pageParam > 0 ? pageParam : 1;
};

const parseSortFromSearchParams = (
  searchParams: URLSearchParams
): {
  sortBy: string;
  sortOrder: "asc" | "desc";
} => {
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  // Validate sortBy
  const validSortFields = [
    "price",
    "year",
    "mileage",
    "created_at",
    "condition_rating",
  ];
  const validatedSortBy = validSortFields.includes(sortBy)
    ? sortBy
    : "created_at";

  return {
    sortBy: validatedSortBy,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : "desc",
  };
};

// Sort dropdown component
interface SortDropdownProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

function SortDropdown({ sortBy, sortOrder, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen]);

  const sortOptions = [
    { value: "created_at-desc", label: "Latest Listings" },
    { value: "price-desc", label: "Price (High-Low)" },
    { value: "price-asc", label: "Price (Low-High)" },
    { value: "year-desc", label: "Year (New-Old)" },
    { value: "year-asc", label: "Year (Old-New)" },
    { value: "mileage-asc", label: "Mileage (Low-High)" },
    { value: "mileage-desc", label: "Mileage (High-Low)" },
  ];

  const currentValue = `${sortBy}-${sortOrder}`;
  const currentLabel =
    sortOptions.find((opt) => opt.value === currentValue)?.label ||
    "Latest Listings";

  const handleSelect = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    onChange(newSortBy, newSortOrder as "asc" | "desc");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent cursor-pointer transition-colors min-w-[200px] justify-between"
      >
        <span className="text-sm">{currentLabel}</span>
        <svg
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-[var(--shadow-md)] z-50 overflow-hidden">
          {sortOptions.map((option) => {
            const isSelected = option.value === currentValue;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? "bg-maroon/10 text-maroon font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const buildSearchParams = (
  filters: SearchFiltersData,
  page: number,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
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
  if (filters.conditionRating !== undefined)
    params.set("conditionRating", filters.conditionRating.toString());
  if (page > 1) params.set("page", page.toString());

  // Add sorting parameters (always include if provided, defaults handled in parse)
  if (sortBy) {
    params.set("sortBy", sortBy);
  }
  if (sortOrder) {
    params.set("sortOrder", sortOrder);
  }

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
  const initialSort = useMemo(
    () => parseSortFromSearchParams(searchParams),
    [searchParams]
  );

  const [cars, setCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<SearchFiltersData>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [sortBy, setSortBy] = useState<string>(initialSort.sortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    initialSort.sortOrder
  );
  const [favoriteCarIds, setFavoriteCarIds] = useState<Set<number>>(new Set());
  const [headerHeight, setHeaderHeight] = useState<number>(80); // Default fallback
  const [availableHeight, setAvailableHeight] = useState<string>(
    "calc(100dvh - 128px)"
  );

  const [referenceData, setReferenceData] = useState<{
    bodyTypes: { code: string; label: string }[];
    transmissions: { code: string; label: string }[];
    drivetrains: { code: string; label: string }[];
    fuelTypes: { code: string; label: string }[];
    provinces: { id: number; label: string }[];
  }>({
    bodyTypes: [],
    transmissions: [],
    drivetrains: [],
    fuelTypes: [],
    provinces: [],
  });

  const { isAuthenticated, roles } = useUserAuth();
  const isBuyer = isAuthenticated && roles?.buyer;

  // Measure header height dynamically using ref
  useEffect(() => {
    const updateHeight = () => {
      // Find the header element (from Layout component)
      const headerElement = document.querySelector(
        'header.fixed, header[class*="fixed"]'
      );
      if (headerElement) {
        const height = headerElement.getBoundingClientRect().height;
        setHeaderHeight(height);
        setAvailableHeight(`calc(100dvh - ${height}px)`);
      } else {
        // Fallback if header not found
        const fallbackHeight = 80;
        setHeaderHeight(fallbackHeight);
        setAvailableHeight(`calc(100dvh - ${fallbackHeight}px)`);
      }
    };

    // Initial measurement with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(updateHeight, 0);

    // Update on resize
    window.addEventListener("resize", updateHeight);

    // Use ResizeObserver for more accurate measurements
    const headerElement = document.querySelector(
      'header.fixed, header[class*="fixed"]'
    );
    let resizeObserver: ResizeObserver | null = null;

    if (headerElement && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateHeight();
      });
      resizeObserver.observe(headerElement);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateHeight);
      if (resizeObserver && headerElement) {
        resizeObserver.unobserve(headerElement);
      }
    };
  }, []);

  // Fetch reference data for filter labels
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const result = await referenceAPI.getAll("en");
        if (result.success) {
          setReferenceData({
            bodyTypes: result.data.bodyTypes || [],
            transmissions: result.data.transmissions || [],
            drivetrains: result.data.drivetrains || [],
            fuelTypes: result.data.fuelTypes || [],
            provinces: result.data.provinces || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  const syncRoute = useCallback(
    (
      nextFilters: SearchFiltersData,
      nextPage: number,
      nextSortBy?: string,
      nextSortOrder?: "asc" | "desc"
    ) => {
      const params = buildSearchParams(
        nextFilters,
        nextPage,
        nextSortBy,
        nextSortOrder
      );
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

      syncRoute(nextFilters, pageToUse, sortBy, sortOrder);
    },
    [syncRoute, sortBy, sortOrder]
  );

  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setPage(1); // Reset to first page when sorting changes
      syncRoute(filters, 1, newSortBy, newSortOrder);
    },
    [filters, syncRoute]
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
        if (filters.conditionRating !== undefined)
          params.conditionRating = filters.conditionRating;

        // Add sorting parameters
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;

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
  }, [filters, page, sortBy, sortOrder]);

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

  const totalPages = Math.ceil(total / 12);

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    syncRoute(filters, nextPage, sortBy, sortOrder);
  };

  // Helper functions for active filters display
  const getFilterLabel = (
    key: string,
    value: string | number | string[]
  ): string => {
    if (key === "search" && typeof value === "string") {
      return value;
    }
    if (key === "bodyType" && typeof value === "string") {
      const bodyType = referenceData.bodyTypes.find((bt) => bt.code === value);
      return bodyType?.label || value;
    }
    if (key === "transmission" && Array.isArray(value)) {
      return value
        .map((code) => {
          const option = referenceData.transmissions.find(
            (t) => t.code === code
          );
          return option?.label || code;
        })
        .join(", ");
    }
    if (key === "drivetrain" && Array.isArray(value)) {
      return value
        .map((code) => {
          const option = referenceData.drivetrains.find((d) => d.code === code);
          return option?.label || code;
        })
        .join(", ");
    }
    if (key === "fuelTypes" && Array.isArray(value)) {
      return value
        .map((code) => {
          const option = referenceData.fuelTypes.find((f) => f.code === code);
          return option?.label || code;
        })
        .join(", ");
    }
    if (key === "provinceId" && typeof value === "number") {
      const province = referenceData.provinces.find((p) => p.id === value);
      return province?.label || `Province ${value}`;
    }
    if (key === "minPrice" || key === "maxPrice") {
      return `${((value as number) / 1000).toFixed(0)}k`;
    }
    if (key === "minYear" && typeof value === "number") {
      return `${value}`;
    }
    if (key === "maxYear" && typeof value === "number") {
      return `${value}`;
    }
    if (key === "minMileage" || key === "maxMileage") {
      return `${((value as number) / 1000).toFixed(0)}k km`;
    }
    if (key === "conditionRating" && typeof value === "number") {
      return `${value} stars`;
    }
    return String(value);
  };

  const getFilterDisplayText = (
    key: string,
    value: string | number | string[]
  ): string => {
    if (key === "search") return getFilterLabel(key, value);
    if (key === "minPrice" && filters.maxPrice) {
      return `Price Range ${getFilterLabel(
        "minPrice",
        value
      )} - ${getFilterLabel("maxPrice", filters.maxPrice)}`;
    }
    if (key === "maxPrice" && filters.minPrice) return ""; // Skip, handled by minPrice
    if (key === "minYear" && filters.maxYear) {
      return `Year ${getFilterLabel("minYear", value)} - ${getFilterLabel(
        "maxYear",
        filters.maxYear
      )}`;
    }
    if (key === "maxYear" && filters.minYear) return ""; // Skip, handled by minYear
    if (key === "minMileage" && filters.maxMileage) {
      return `Mileage ${getFilterLabel("minMileage", value)} - ${getFilterLabel(
        "maxMileage",
        filters.maxMileage
      )}`;
    }
    if (key === "maxMileage" && filters.minMileage) return ""; // Skip, handled by minMileage
    return getFilterLabel(key, value);
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (!value) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    // Skip ranges that are handled by their min/max pairs
    if (key === "maxPrice" && filters.minPrice) return false;
    if (key === "maxYear" && filters.minYear) return false;
    if (key === "maxMileage" && filters.minMileage) return false;
    return true;
  });

  const removeFilter = (key: keyof SearchFiltersData) => {
    const nextFilters = { ...filters };
    delete nextFilters[key];
    applyFilters(nextFilters);
  };

  const clearAllFilters = () => {
    applyFilters({});
  };

  return (
    <div className="max-w-[1536px] mx-auto w-full">
      <div className="flex flex-row">
        {/* Filters Sidebar */}
        <SearchFilters
          filters={filters}
          searchInput={searchInput}
          onFiltersChange={handleFiltersChange}
          onSearchSubmit={handleSearchSubmit}
          onSearchInputChange={(value) => setSearchInput(value)}
          className="sticky self-start p-(--space-s-m) pr-0"
          style={{
            top: `${headerHeight}px`,
            maxHeight: availableHeight,
          }}
        />

        {/* Results */}
        <div className="flex-1 p-(--space-s-m)">
          {/* Active Filters Bar */}
          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 p-4 rounded-lg border border-gray-200">
              {activeFilters.map(([key, value]) => {
                const displayText = getFilterDisplayText(
                  key,
                  value as string | number | string[]
                );
                if (!displayText) return null;
                return (
                  <button
                    key={key}
                    onClick={() => removeFilter(key as keyof SearchFiltersData)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span>{displayText}</span>
                    <span className="text-gray-500 hover:text-gray-700">x</span>
                  </button>
                );
              })}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="ml-auto px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
          {/* Results Header */}
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {total} {total === 1 ? "car" : "cars"} found
            </p>
            {/* Sort Dropdown */}
            <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onChange={handleSortChange}
            />
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
            <>
              <div className="text-center py-12 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  No Cars Found
                </h2>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Car Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {cars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    favorite={
                      isBuyer
                        ? {
                            isFavorited: favoriteCarIds.has(car.id),
                            onToggle: handleFavoriteToggle,
                          }
                        : undefined
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8">
                  <PaginateControl
                    page={page}
                    setPage={handlePageChange}
                    totalPages={totalPages}
                  />
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
