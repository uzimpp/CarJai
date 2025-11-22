"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  referenceAPI,
  type ProvinceOption,
  type ReferenceOption,
} from "@/lib/referenceAPI";
import DualRangeSlider from "./DualRangeSlider";
import RangeInput from "./RangeInput";
import IconSelector from "./IconSelector";
import ColorSelector from "./ColorSelector";
import DropdownFilter from "./DropdownFilter";
import SearchInputField from "./SearchInputField";
import CollapsibleFilterSection from "./CollapsibleFilterSection";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import StarRating from "@/components/ui/StarRating";

// Color code to hex mapping (matching backend color codes)
const COLOR_MAP: Record<string, string[]> = {
  RED: ["#EF4444"],
  GRAY: ["#6B7280"],
  BLUE: ["#3B82F6"],
  LIGHT_BLUE: ["#60A5FA"],
  YELLOW: ["#FBBF24"],
  PINK: ["#EC4899"],
  WHITE: ["#FFFFFF"],
  BROWN: ["#92400E"],
  BLACK: ["#000000"],
  ORANGE: ["#F97316"],
  PURPLE: ["#A855F7"],
  GREEN: ["#10B981"],
  MULTICOLOR: ["#EF4444", "#3B82F6", "#FBBF24"], // Red, Blue, Yellow
};

interface SearchFiltersProps {
  filters: SearchFiltersData;
  searchInput: string;
  onFiltersChange: (filters: SearchFiltersData) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSearchInputChange: (value: string) => void;
}

export interface SearchFiltersData {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  bodyType?: string;
  transmission?: string[];
  drivetrain?: string[];
  fuelTypes?: string[];
  colors?: string[];
  provinceId?: number;
  conditionRating?: number;
}

export default function SearchFilters({
  filters,
  searchInput,
  onFiltersChange,
  onSearchSubmit,
  onSearchInputChange,
}: SearchFiltersProps) {
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

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="h-[calc(100dvh-var(--navbar-height))] flex flex-col">
      <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={onSearchSubmit} className="space-y-3 p-(--space-s-m)">
            {/* Search */}
            <div className="relative">
              <SearchInputField
                value={searchInput}
                onChange={onSearchInputChange}
                placeholder="Search cars, brands, models..."
              />
            </div>

            {/* Filters Section */}
            <div className="border-t border-gray-100">
              {/* Price Range */}
              <CollapsibleFilterSection
                label="Price Range (฿)"
                defaultExpanded={!!(filters.minPrice || filters.maxPrice)}
              >
                <RangeInput
                  minValue={filters.minPrice}
                  maxValue={filters.maxPrice}
                  onRangeChange={(min, max) => {
                    const nextFilters = { ...filters };
                    min === undefined
                      ? delete nextFilters.minPrice
                      : (nextFilters.minPrice = min);
                    max === undefined
                      ? delete nextFilters.maxPrice
                      : (nextFilters.maxPrice = max);
                    onFiltersChange(nextFilters);
                  }}
                  step={1000}
                  min={0}
                  predefinedRanges={[
                    { label: "≤ ฿500,000", min: undefined, max: 500000 },
                    { label: "฿500K - ฿1M", min: 500000, max: 1000000 },
                    { label: "฿1M - ฿2M", min: 1000000, max: 2000000 },
                    { label: "≥ ฿2M", min: 2000000, max: undefined },
                  ]}
                />
              </CollapsibleFilterSection>

              {/* Year Range */}
              <CollapsibleFilterSection
                label="Year Range"
                defaultExpanded={!!(filters.minYear || filters.maxYear)}
              >
                <DualRangeSlider
                  min={1990}
                  max={new Date().getFullYear()}
                  minValue={filters.minYear}
                  maxValue={filters.maxYear}
                  onMinChange={(value) => handleChange("minYear", value)}
                  onMaxChange={(value) => handleChange("maxYear", value)}
                  step={1}
                  formatValue={(v) => v.toString()}
                />
              </CollapsibleFilterSection>

              {/* Mileage Range */}
              <CollapsibleFilterSection
                label="Mileage (km)"
                defaultExpanded={!!(filters.minMileage || filters.maxMileage)}
              >
                <RangeInput
                  minValue={filters.minMileage}
                  maxValue={filters.maxMileage}
                  onRangeChange={(min, max) => {
                    const nextFilters = { ...filters };
                    min === undefined
                      ? delete nextFilters.minMileage
                      : (nextFilters.minMileage = min);
                    max === undefined
                      ? delete nextFilters.maxMileage
                      : (nextFilters.maxMileage = max);
                    onFiltersChange(nextFilters);
                  }}
                  predefinedRanges={[
                    { label: "≤ 15,000 km", min: undefined, max: 15000 },
                    { label: "15,000 - 30,000 km", min: 15000, max: 30000 },
                    { label: "≤ 100,000 km", min: undefined, max: 100000 },
                  ]}
                  step={1000}
                  min={0}
                />
              </CollapsibleFilterSection>

              {/* Body Type */}
              <CollapsibleFilterSection
                label="Body Type"
                defaultExpanded={!!filters.bodyType}
              >
                <IconSelector
                  options={[
                    {
                      code: "CITYCAR",
                      label: "City Car",
                      icon: <span className="text-3xl">🚗</span>,
                    },
                    {
                      code: "DAILY",
                      label: "Sedan",
                      icon: <span className="text-3xl">🚙</span>,
                    },
                    {
                      code: "SPORTLUX",
                      label: "Luxury",
                      icon: <span className="text-3xl">🏎️</span>,
                    },
                    {
                      code: "SUV",
                      label: "SUV",
                      icon: <span className="text-3xl">🚐</span>,
                    },
                    {
                      code: "VAN",
                      label: "Van",
                      icon: <span className="text-3xl">🚐</span>,
                    },
                    {
                      code: "PICKUP",
                      label: "Pickup",
                      icon: <span className="text-3xl">🛻</span>,
                    },
                  ]}
                  selectedValues={filters.bodyType ? [filters.bodyType] : []}
                  onChange={(values) =>
                    handleChange(
                      "bodyType",
                      values.length > 0 ? values[0] : undefined
                    )
                  }
                  multiple={false}
                  columns={3}
                />
              </CollapsibleFilterSection>

              {/* Transmission */}
              <CollapsibleFilterSection
                label="Transmission"
                defaultExpanded={
                  !!filters.transmission && filters.transmission.length > 0
                }
              >
                <CheckBoxes
                  name="transmission"
                  values={filters.transmission || []}
                  options={referenceData.transmissions.map((t) => ({
                    value: t.code,
                    label: t.label,
                  }))}
                  onChange={(values) =>
                    handleChange(
                      "transmission",
                      values.length > 0 ? values : undefined
                    )
                  }
                  direction="column"
                />
              </CollapsibleFilterSection>

              {/* Drivetrain */}
              <CollapsibleFilterSection
                label="Drivetrain"
                defaultExpanded={
                  !!filters.drivetrain && filters.drivetrain.length > 0
                }
              >
                <CheckBoxes
                  name="drivetrain"
                  values={filters.drivetrain || []}
                  options={referenceData.drivetrains.map((d) => ({
                    value: d.code,
                    label: d.label,
                  }))}
                  onChange={(values) =>
                    handleChange(
                      "drivetrain",
                      values.length > 0 ? values : undefined
                    )
                  }
                  direction="column"
                />
              </CollapsibleFilterSection>

              {/* Fuel Types */}
              <CollapsibleFilterSection
                label="Fuel Type"
                defaultExpanded={
                  !!filters.fuelTypes && filters.fuelTypes.length > 0
                }
              >
                <IconSelector
                  options={[
                    {
                      code: "GASOLINE",
                      label: "Gasoline",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                          >
                            <path d="M20 13.277c0-4.525-4.59-8.481-6.81-10.136a2.004 2.004 0 0 0-2.38 0C8.59 4.796 4 8.752 4 13.277c0 5.98 5 7.973 8 7.973s8-1.993 8-7.973"></path>
                            <path d="M7 13.277c0 1.322.527 2.59 1.464 3.524A5.009 5.009 0 0 0 12 18.26"></path>
                          </g>
                        </svg>
                      ),
                    },
                    {
                      code: "DIESEL",
                      label: "Diesel",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                            color="currentColor"
                          >
                            <path d="M5 6v-.5c0-.943 0-1.414.293-1.707S6.057 3.5 7 3.5s1.414 0 1.707.293S9 4.557 9 5.5V6m6-1h3" />
                            <path d="M16 2h-1.333C12.793 2 12 2.934 12 4.667C12 5.533 11.603 6 10.667 6H7c-1.886 0-2.828 0-3.414.586S3 8.114 3 10v5c0 3.3 0 4.95 1.025 5.975S6.7 22 10 22h4c3.3 0 4.95 0 5.975-1.025S21 18.3 21 15V7c0-2.357 0-3.536-.732-4.268C19.535 2 18.357 2 16 2" />
                            <path d="M9 14.587c0-1.464 1.264-2.911 2.15-3.747a1.23 1.23 0 0 1 1.7 0c.886.836 2.15 2.283 2.15 3.747a2.933 2.933 0 0 1-3 2.913c-1.864 0-3-1.477-3-2.913" />
                          </g>
                        </svg>
                      ),
                    },
                    {
                      code: "HYBRID",
                      label: "Hybrid",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          viewBox="0 0 32 32"
                        >
                          <path
                            fill="currentColor"
                            d="M26 22a3.958 3.958 0 0 0-2.02.566L17.414 16l6.567-6.567A3.952 3.952 0 0 0 26 10a4 4 0 1 0-4-4a3.951 3.951 0 0 0 .567 2.019L16 14.586L9.434 8.02A3.958 3.958 0 0 0 10 6a4 4 0 1 0-4 4a3.958 3.958 0 0 0 2.02-.566L14.586 16l-6.567 6.567A3.952 3.952 0 0 0 6 22a4 4 0 1 0 4 4a3.951 3.951 0 0 0-.567-2.019L16 17.414l6.566 6.566A3.958 3.958 0 0 0 22 26a4 4 0 1 0 4-4Zm0-18a2 2 0 1 1-2 2a2.002 2.002 0 0 1 2-2ZM6 28a2 2 0 1 1 2-2a2.002 2.002 0 0 1-2 2Z"
                          />
                        </svg>
                      ),
                    },
                    {
                      code: "ELECTRIC",
                      label: "Electric",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                            d="M13 2v8h7l-9 12v-8H4Z"
                          />
                        </svg>
                      ),
                    },
                    {
                      code: "LPG",
                      label: "LPG/NGV",
                      icon: (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <g
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                          >
                            <path d="M5 21c.5-4.5 2.5-8 7-10" />
                            <path d="M9 18c6.218 0 10.5-3.288 11-12V4h-4.014c-9 0-11.986 4-12 9c0 1 0 3 2 5h3z" />
                          </g>
                        </svg>
                      ),
                    },
                  ]}
                  selectedValues={filters.fuelTypes || []}
                  onChange={(values) =>
                    handleChange(
                      "fuelTypes",
                      values.length > 0 ? values : undefined
                    )
                  }
                  multiple={true}
                  columns={3}
                />
              </CollapsibleFilterSection>

              {/* Colors */}
              <CollapsibleFilterSection
                label="Colors"
                defaultExpanded={!!filters.colors && filters.colors.length > 0}
              >
                <ColorSelector
                  options={referenceData.colors.map((c) => ({
                    code: c.code,
                    label: c.label,
                  }))}
                  selectedValues={filters.colors || []}
                  onChange={(values) =>
                    handleChange(
                      "colors",
                      values.length > 0 ? values : undefined
                    )
                  }
                  colorMap={COLOR_MAP}
                />
              </CollapsibleFilterSection>

              {/* Condition Rating */}
              <CollapsibleFilterSection
                label="Condition Rating"
                defaultExpanded={!!filters.conditionRating}
              >
                <div className="flex flex-col items-center justify-start gap-3 flex-wrap">
                  <StarRating
                    value={filters.conditionRating}
                    onChange={(value) =>
                      handleChange(
                        "conditionRating",
                        value === filters.conditionRating ? undefined : value
                      )
                    }
                  />
                </div>
              </CollapsibleFilterSection>

              {/* Province */}
              <CollapsibleFilterSection
                label="Province"
                defaultExpanded={!!filters.provinceId}
              >
                <DropdownFilter
                  value={filters.provinceId}
                  options={referenceData.provinces.map((p) => ({
                    code: p.id.toString(),
                    label: p.label,
                  }))}
                  onChange={(value) =>
                    handleChange(
                      "provinceId",
                      value ? parseInt(value as string) : undefined
                    )
                  }
                  allOptionLabel="All Provinces"
                />
              </CollapsibleFilterSection>
            </div>
          </form>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text--1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
