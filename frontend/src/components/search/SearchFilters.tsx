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
import ColorSelector from "./ColorSelector";
import DropdownFilter from "./DropdownFilter";
import SearchInputField from "./SearchInputField";
import CollapsibleFilterSection from "./CollapsibleFilterSection";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import StarRating from "@/components/ui/StarRating";
import { FuelTypeIcons, BodyTypeIcons } from "./filterIcons";

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
  style?: React.CSSProperties;
  className?: string;
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
  style,
  className = "",
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
    <div className={`flex flex-col w-80 ${className}`} style={style}>
      <div className="bg-white rounded-3xl shadow-sm flex flex-col h-full overflow-hidden max-h-full">
        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={onSearchSubmit} className="p-(--space-s-m)">
            {/* Search */}
            <div className="relative mb-5">
              <SearchInputField
                value={searchInput}
                onChange={onSearchInputChange}
                placeholder="Search cars ..."
                className="bg-gray-100"
              />
            </div>

            <div className="flex flex-row items-center justify-between">
              <h2 className="text-0 font-bold text-maroon mb-2">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text--1 text-maroon hover:text-maroon/80 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Filters Section */}
            <div className="border-t border-gray-100 ">
              {/* Price Range */}
              <CollapsibleFilterSection label="Price Range (฿)">
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
                  step={1}
                  min={0}
                  max={1999999999}
                  predefinedRanges={[
                    { label: "≤ 300k", min: undefined, max: 300000 },
                    { label: "300k - 500k", min: 300000, max: 500000 },
                    { label: "500k - 1M", min: 500000, max: 1000000 },
                    { label: "≥ 1M", min: 1000000, max: undefined },
                  ]}
                />
              </CollapsibleFilterSection>

              {/* Year Range */}
              <CollapsibleFilterSection label="Year Range">
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
              <CollapsibleFilterSection label="Mileage (km)">
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
                  max={1999999999}
                />
              </CollapsibleFilterSection>

              {/* Colors */}
              <CollapsibleFilterSection label="Colors">
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

              {/* Fuel Types */}
              <CollapsibleFilterSection label="Fuel Type">
                <CheckBoxes
                  name="fuelTypes"
                  values={filters.fuelTypes || []}
                  options={[
                    {
                      value: "GASOLINE",
                      label: "Gasoline",
                      icon: FuelTypeIcons.GASOLINE,
                    },
                    {
                      value: "DIESEL",
                      label: "Diesel",
                      icon: FuelTypeIcons.DIESEL,
                    },
                    {
                      value: "HYBRID",
                      label: "Hybrid",
                      icon: FuelTypeIcons.HYBRID,
                    },
                    {
                      value: "ELECTRIC",
                      label: "Electric",
                      icon: FuelTypeIcons.ELECTRIC,
                    },
                    {
                      value: "LPG",
                      label: "LPG/NGV",
                      icon: FuelTypeIcons.LPG,
                    },
                  ]}
                  onChange={(values) =>
                    handleChange(
                      "fuelTypes",
                      values.length > 0 ? values : undefined
                    )
                  }
                  columns={3}
                />
              </CollapsibleFilterSection>

              {/* Body Type */}
              <CollapsibleFilterSection label="Body Type">
                <CheckBoxes
                  name="bodyType"
                  values={filters.bodyType ? [filters.bodyType] : []}
                  options={[
                    {
                      value: "CITYCAR",
                      label: "City Car",
                      icon: BodyTypeIcons.CITYCAR,
                    },
                    {
                      value: "DAILY",
                      label: "Sedan",
                      icon: BodyTypeIcons.DAILY,
                    },
                    {
                      value: "SPORTLUX",
                      label: "Luxury",
                      icon: BodyTypeIcons.SPORTLUX,
                    },
                    {
                      value: "SUV",
                      label: "SUV",
                      icon: BodyTypeIcons.SUV,
                    },
                    {
                      value: "VAN",
                      label: "Van",
                      icon: BodyTypeIcons.VAN,
                    },
                    {
                      value: "PICKUP",
                      label: "Pickup",
                      icon: BodyTypeIcons.PICKUP,
                    },
                  ]}
                  onChange={(values) =>
                    handleChange(
                      "bodyType",
                      values.length > 0 ? values[0] : undefined
                    )
                  }
                  columns={3}
                />
              </CollapsibleFilterSection>

              {/* Condition Rating */}
              <CollapsibleFilterSection label="Condition Rating">
                <div className="flex flex-col items-center justify-start gap-3 flex-wrap">
                  <StarRating
                    value={filters.conditionRating}
                    onChange={(value) => {
                      // Toggle off if clicking the same star, otherwise set the value
                      handleChange(
                        "conditionRating",
                        value === filters.conditionRating ? undefined : value
                      );
                    }}
                  />
                  {filters.conditionRating ? (
                    <p className="text-xs text-gray-600 text-center">
                      Showing cars with {filters.conditionRating}+ stars
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 text-center">
                      Select minimum rating
                    </p>
                  )}
                </div>
              </CollapsibleFilterSection>

              {/* Province */}
              <CollapsibleFilterSection label="Province">
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

              {/* Transmission */}
              <CollapsibleFilterSection label="Transmission">
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
              <CollapsibleFilterSection label="Drivetrain">
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
