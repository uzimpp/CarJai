"use client";

import { useState } from "react";

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFiltersData) => void;
}

export interface SearchFiltersData {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  bodyType?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  conditionRating?: number;
}

export default function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFiltersData>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (
    key: keyof SearchFiltersData,
    value: string | number | undefined
  ) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-maroon hover:underline"
        >
          {isExpanded ? "Hide" : "Show"} Filters
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Brand, model, etc."
              value={filters.search || ""}
              onChange={(e) => handleChange("search", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (฿)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  handleChange(
                    "minPrice",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (฿)
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  handleChange(
                    "maxPrice",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>
          </div>

          {/* Year Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Year
              </label>
              <input
                type="number"
                placeholder="1990"
                value={filters.minYear || ""}
                onChange={(e) =>
                  handleChange(
                    "minYear",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Year
              </label>
              <input
                type="number"
                placeholder="2024"
                value={filters.maxYear || ""}
                onChange={(e) =>
                  handleChange(
                    "maxYear",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>
          </div>

          {/* Max Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Mileage (km)
            </label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maxMileage || ""}
              onChange={(e) =>
                handleChange(
                  "maxMileage",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
            />
          </div>

          {/* Clear Button */}
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
