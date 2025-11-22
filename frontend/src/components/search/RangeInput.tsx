"use client";

import { useState, useEffect, useRef } from "react";

interface RangeInputProps {
  minValue: number | undefined;
  maxValue: number | undefined;
  onRangeChange: (min: number | undefined, max: number | undefined) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  step?: number;
  min?: number; // Minimum allowed value (e.g., 0 to prevent negatives)
  max?: number; // Maximum allowed value (e.g., 1999999999 to prevent integer overflow)
  predefinedRanges?: Array<{
    label: string;
    min?: number;
    max?: number;
  }>;
}

export default function RangeInput({
  minValue,
  maxValue,
  onRangeChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  step = 1,
  min = 0,
  max,
  predefinedRanges,
}: RangeInputProps) {
  // Helper function to format number with thousand separators
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return "";
    return num.toLocaleString("en-US");
  };

  // Helper function to remove commas and parse number
  const parseNumberString = (str: string): number | undefined => {
    const cleaned = str.replace(/,/g, "");
    if (cleaned === "") return undefined;
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  // Local state to track raw input values for typing (stored without commas)
  const [minInput, setMinInput] = useState<string>(
    minValue?.toLocaleString("en-US") || ""
  );
  const [maxInput, setMaxInput] = useState<string>(
    maxValue?.toLocaleString("en-US") || ""
  );
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when props change (from external updates like predefined ranges)
  // Only sync if the input is not currently focused
  useEffect(() => {
    if (document.activeElement !== minInputRef.current) {
      const currentParsed = parseNumberString(minInput);
      if (currentParsed !== minValue) {
        setMinInput(formatNumber(minValue));
      }
    }
  }, [minValue, minInput]);

  useEffect(() => {
    if (document.activeElement !== maxInputRef.current) {
      const currentParsed = parseNumberString(maxInput);
      if (currentParsed !== maxValue) {
        setMaxInput(formatNumber(maxValue));
      }
    }
  }, [maxValue]);

  const handleMinChange = (value: number | undefined) => {
    let validMin: number | undefined = undefined;
    let validMax = maxValue;

    if (value !== undefined) {
      // Ensure value is within bounds and rounds to step
      let clampedValue = Math.max(min, Math.floor(value / step) * step);
      if (max !== undefined && clampedValue > max) {
        clampedValue = max;
      }
      validMin = clampedValue;
      // Ensure min is not greater than max
      if (validMax !== undefined && validMin > validMax) {
        // If min exceeds max, adjust max to be at least equal to min
        validMax = validMin;
      }
    }

    onRangeChange(validMin, validMax);
  };

  const handleMaxChange = (value: number | undefined) => {
    let validMax: number | undefined = undefined;
    let validMin = minValue;

    if (value !== undefined) {
      // Ensure value is within bounds and rounds to step
      let clampedValue = Math.max(min, Math.floor(value / step) * step);
      if (max !== undefined && clampedValue > max) {
        clampedValue = max;
      }
      validMax = clampedValue;
      // Ensure max is not less than min
      if (validMin !== undefined && validMax < validMin) {
        // If max is less than min, adjust min to be at most equal to max
        validMin = validMax;
      }
    }

    onRangeChange(validMin, validMax);
  };

  const handlePredefinedRange = (
    rangeMin: number | undefined,
    rangeMax: number | undefined
  ) => {
    // Set both values together to avoid validation conflicts
    let validMin: number | undefined = undefined;
    let validMax: number | undefined = undefined;

    // First, process and validate both values
    if (rangeMin !== undefined) {
      let clampedValue = Math.max(min, Math.floor(rangeMin / step) * step);
      if (max !== undefined && clampedValue > max) {
        clampedValue = max;
      }
      validMin = clampedValue;
    }

    if (rangeMax !== undefined) {
      let clampedValue = Math.max(min, Math.floor(rangeMax / step) * step);
      if (max !== undefined && clampedValue > max) {
        clampedValue = max;
      }
      validMax = clampedValue;
    }

    // Ensure max is not less than min (only if both are defined)
    if (
      validMin !== undefined &&
      validMax !== undefined &&
      validMax < validMin
    ) {
      validMax = validMin;
    }

    // Set both values together in a single update
    onRangeChange(validMin, validMax);
  };

  // Debounced update functions for while typing
  const minChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (minChangeTimeoutRef.current) {
        clearTimeout(minChangeTimeoutRef.current);
      }
      if (maxChangeTimeoutRef.current) {
        clearTimeout(maxChangeTimeoutRef.current);
      }
    };
  }, []);

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    // Remove commas first, then remove any non-numeric characters
    rawValue = rawValue.replace(/,/g, "").replace(/[^0-9]/g, "");

    // Step 1: Parse the value
    let numValue = rawValue === "" ? undefined : parseFloat(rawValue);

    // Step 2: Handle min/max clamping first
    if (numValue !== undefined && !isNaN(numValue)) {
      // Clamp to min and max bounds
      numValue = Math.max(min, numValue);
      if (max !== undefined && numValue > max) {
        numValue = max;
      }
      // Round to step after clamping
      numValue = Math.floor(numValue / step) * step;
    }

    // Step 3: Format the clamped and rounded value for display
    const formatted =
      numValue !== undefined && !isNaN(numValue)
        ? formatNumber(numValue)
        : rawValue;

    setMinInput(formatted);

    // Update parent immediately if empty, otherwise debounce
    if (rawValue === "") {
      if (minChangeTimeoutRef.current) {
        clearTimeout(minChangeTimeoutRef.current);
        minChangeTimeoutRef.current = null;
      }
      handleMinChange(undefined);
    } else if (numValue !== undefined && !isNaN(numValue)) {
      if (minChangeTimeoutRef.current) {
        clearTimeout(minChangeTimeoutRef.current);
      }
      minChangeTimeoutRef.current = setTimeout(() => {
        handleMinChange(numValue);
      }, 500);
    }
  };

  const handleMinInputBlur = () => {
    // Final validation on blur
    if (minInput === "") {
      setMinInput("");
      handleMinChange(undefined);
      return;
    }

    const numValue = parseNumberString(minInput);
    if (
      numValue === undefined ||
      numValue < min ||
      (max !== undefined && numValue > max)
    ) {
      // Invalid input - revert to previous value with formatting
      setMinInput(formatNumber(minValue));
    } else {
      // Valid number - update with validated value
      handleMinChange(numValue);
      // Update display with formatted value after validation
      let validated = Math.max(min, Math.floor(numValue / step) * step);
      if (max !== undefined && validated > max) {
        validated = max;
      }
      setMinInput(formatNumber(validated));
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    // Remove commas first, then remove any non-numeric characters
    rawValue = rawValue.replace(/,/g, "").replace(/[^0-9]/g, "");

    // Step 1: Parse the value
    let numValue = rawValue === "" ? undefined : parseFloat(rawValue);

    // Step 2: Handle min/max clamping first
    if (numValue !== undefined && !isNaN(numValue)) {
      // Clamp to min and max bounds
      numValue = Math.max(min, numValue);
      if (max !== undefined && numValue > max) {
        numValue = max;
      }
      // Round to step after clamping
      numValue = Math.floor(numValue / step) * step;
    }

    // Step 3: Format the clamped and rounded value for display
    const formatted =
      numValue !== undefined && !isNaN(numValue)
        ? formatNumber(numValue)
        : rawValue;

    setMaxInput(formatted);

    // Update parent immediately if empty, otherwise debounce
    if (rawValue === "") {
      if (maxChangeTimeoutRef.current) {
        clearTimeout(maxChangeTimeoutRef.current);
        maxChangeTimeoutRef.current = null;
      }
      handleMaxChange(undefined);
    } else if (numValue !== undefined && !isNaN(numValue)) {
      if (maxChangeTimeoutRef.current) {
        clearTimeout(maxChangeTimeoutRef.current);
      }
      maxChangeTimeoutRef.current = setTimeout(() => {
        handleMaxChange(numValue);
      }, 500);
    }
  };

  const handleMaxInputBlur = () => {
    // Final validation on blur
    if (maxInput === "") {
      setMaxInput("");
      handleMaxChange(undefined);
      return;
    }

    const numValue = parseNumberString(maxInput);
    if (
      numValue === undefined ||
      numValue < min ||
      (max !== undefined && numValue > max)
    ) {
      // Invalid input - revert to previous value with formatting
      setMaxInput(formatNumber(maxValue));
    } else {
      // Valid number - update with validated value
      handleMaxChange(numValue);
      // Update display with formatted value after validation
      let validated = Math.max(min, Math.floor(numValue / step) * step);
      if (max !== undefined && validated > max) {
        validated = max;
      }
      setMaxInput(formatNumber(validated));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          ref={minInputRef}
          type="text"
          inputMode="numeric"
          placeholder={minPlaceholder}
          value={minInput}
          onChange={handleMinInputChange}
          onBlur={handleMinInputBlur}
          className="w-full sm:w-full px-3 py-2 bg-gray-100 rounded-lg text-black focus:bg-gray-200 focus:outline-none transition-all"
        />
        <span className="text-gray-500 text-center sm:text-left hidden sm:inline">
          -
        </span>
        <input
          ref={maxInputRef}
          type="text"
          inputMode="numeric"
          placeholder={maxPlaceholder}
          value={maxInput}
          onChange={handleMaxInputChange}
          onBlur={handleMaxInputBlur}
          className="w-full sm:w-full px-3 py-2 bg-gray-100 rounded-lg text-black focus:bg-gray-200 focus:outline-none transition-all"
        />
      </div>
      {predefinedRanges && predefinedRanges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {predefinedRanges.map((range) => {
            const isActive =
              (minValue === range.min ||
                (range.min === undefined && minValue === undefined)) &&
              (maxValue === range.max ||
                (range.max === undefined && maxValue === undefined));
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => {
                  handlePredefinedRange(range.min, range.max);
                }}
                className={`px-3 py-1 rounded-full border-1 text--1 transition-all duration-300 ease-in-out text-center whitespace-nowrap ${
                  isActive
                    ? "border-maroon bg-maroon text-white shadow-sm"
                    : "border-maroon bg-white text-maroon hover:bg-maroon/10 hover:shadow-sm"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
