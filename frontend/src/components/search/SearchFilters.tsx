"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import {
  referenceAPI,
  type ProvinceOption,
  type ReferenceOption,
} from "@/lib/referenceAPI";

export type CategoryValue = "all" | "electric" | "sport" | "family" | "compact";

export type CategoryOption = {
  value: CategoryValue;
  label: string;
  fuelTypes?: string[];
  bodyType?: string;
};

interface SearchFiltersProps {
  filters: SearchFiltersData;
  searchInput: string;
  category: CategoryValue;
  categoryOptions: CategoryOption[];
  onFiltersChange: (filters: SearchFiltersData) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchInputChange: (value: string) => void;
  onCategoryChange: (value: CategoryValue) => void;
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
  fuelTypes?: string[];
  colors?: string[];
  provinceId?: number;
  conditionRating?: number;
}

export default function SearchFilters({
  filters,
  searchInput,
  category,
  categoryOptions,
  onFiltersChange,
  onSearchSubmit,
  onSearchInputChange,
  onCategoryChange,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [referenceData, setReferenceData] = useState<{
    provinces: ProvinceOption[];
    transmissions: ReferenceOption[];
    drivetrains: ReferenceOption[];
    colors: ReferenceOption[];
  }>({
    provinces: [],
    transmissions: [],
    drivetrains: [],
    colors: [],
  });

  // Fetch reference data on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const result = await referenceAPI.getAll("en");
        if (result.success) {
          setReferenceData({
            provinces: result.data.provinces || [],
            transmissions: result.data.transmissions || [],
            drivetrains: result.data.drivetrains || [],
            colors: result.data.colors || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  const handleChange = (
    key: keyof SearchFiltersData,
    value: string | number | string[] | undefined
  ) => {
    const shouldRemove =
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (shouldRemove) {
      const nextFilters = { ...filters } as Record<string, unknown>;
      delete nextFilters[key as string];
      onFiltersChange(nextFilters as SearchFiltersData);
      return;
    }

    onFiltersChange({
      ...filters,
      [key]: value as never,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-6">
      {/* Search Bar and Category */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <form onSubmit={onSearchSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search cars, e.g. Mitsu"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                onCategoryChange(e.target.value as CategoryValue)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/40"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-maroon px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-maroon/90 focus:outline-none focus:ring-2 focus:ring-maroon/40"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters */}
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

          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Type
            </label>
            <select
              value={filters.bodyType || ""}
              onChange={(e) =>
                handleChange("bodyType", e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="PICKUP">Pickup</option>
              <option value="VAN">Van</option>
              <option value="CITYCAR">City Car</option>
              <option value="DAILY">Daily Use</option>
              <option value="SUV">SUV</option>
              <option value="SPORTLUX">Sport / Luxury</option>
            </select>
          </div>

          {/* Fuel Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Type
            </label>
            <div className="space-y-2">
              {[
                { code: "GASOLINE", label: "Gasoline" },
                { code: "DIESEL", label: "Diesel" },
                { code: "ELECTRIC", label: "Electric" },
                { code: "HYBRID", label: "Hybrid" },
                { code: "LPG", label: "LPG" },
                { code: "CNG", label: "CNG" },
              ].map((fuel) => (
                <label key={fuel.code} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.fuelTypes?.includes(fuel.code) || false}
                    onChange={(e) => {
                      const currentFuels = filters.fuelTypes || [];
                      const newFuels = e.target.checked
                        ? [...currentFuels, fuel.code]
                        : currentFuels.filter((f) => f !== fuel.code);
                      handleChange(
                        "fuelTypes",
                        newFuels.length > 0 ? newFuels : undefined
                      );
                    }}
                    className="w-4 h-4 text-maroon border-gray-300 rounded focus:ring-maroon"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {fuel.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

            {/* Transmission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transmission
              </label>
              <select
                value={filters.transmission || ""}
                onChange={(e) =>
                  handleChange("transmission", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              >
                <option value="">All Types</option>
                {referenceData.transmissions.map((transmission) => (
                  <option key={transmission.code} value={transmission.code}>
                    {transmission.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Drivetrain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drivetrain
              </label>
              <select
                value={filters.drivetrain || ""}
                onChange={(e) =>
                  handleChange("drivetrain", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              >
                <option value="">All Types</option>
                {referenceData.drivetrains.map((drivetrain) => (
                  <option key={drivetrain.code} value={drivetrain.code}>
                    {drivetrain.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {referenceData.colors.map((color) => (
                  <label key={color.code} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.colors?.includes(color.code) || false}
                      onChange={(e) => {
                        const currentColors = filters.colors || [];
                        const newColors = e.target.checked
                          ? [...currentColors, color.code]
                          : currentColors.filter((c) => c !== color.code);
                        handleChange(
                          "colors",
                          newColors.length > 0 ? newColors : undefined
                        );
                      }}
                      className="w-4 h-4 text-maroon border-gray-300 rounded focus:ring-maroon"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {color.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                value={filters.provinceId || ""}
                onChange={(e) =>
                  handleChange(
                    "provinceId",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              >
                <option value="">All Provinces</option>
                {referenceData.provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.label}
                  </option>
                ))}
              </select>
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
    </div>
  );
}
