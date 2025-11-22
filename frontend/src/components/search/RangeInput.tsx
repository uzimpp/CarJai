"use client";

interface RangeInputProps {
  minValue: number | undefined;
  maxValue: number | undefined;
  onRangeChange: (min: number | undefined, max: number | undefined) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  step?: number;
  min?: number; // Minimum allowed value (e.g., 0 to prevent negatives)
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
  predefinedRanges,
}: RangeInputProps) {
  const handleMinChange = (value: number | undefined) => {
    let validMin: number | undefined = undefined;
    let validMax = maxValue;

    if (value !== undefined) {
      // Ensure value is not negative and rounds to step
      validMin = Math.max(min, Math.floor(value / step) * step);
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
      // Ensure value is not negative and rounds to step
      validMax = Math.max(min, Math.floor(value / step) * step);
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
      validMin = Math.max(min, Math.floor(rangeMin / step) * step);
    }

    if (rangeMax !== undefined) {
      validMax = Math.max(min, Math.floor(rangeMax / step) * step);
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="number"
          placeholder={minPlaceholder}
          value={minValue || ""}
          min={min}
          step={step}
          onChange={(e) => {
            const value = e.target.value
              ? parseFloat(e.target.value)
              : undefined;
            if (value !== undefined && !isNaN(value)) {
              handleMinChange(value);
            } else if (e.target.value === "") {
              handleMinChange(undefined);
            }
          }}
          className="w-full sm:w-full px-3 py-2 border border-gray-300 rounded-lg text-0 text-gray-900 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20 transition-all"
        />
        <span className="text-gray-500 text-center sm:text-left hidden sm:inline">
          -
        </span>
        <input
          type="number"
          placeholder={maxPlaceholder}
          value={maxValue || ""}
          min={min}
          step={step}
          onChange={(e) => {
            const value = e.target.value
              ? parseFloat(e.target.value)
              : undefined;
            if (value !== undefined && !isNaN(value)) {
              handleMaxChange(value);
            } else if (e.target.value === "") {
              handleMaxChange(undefined);
            }
          }}
          className="w-full sm:w-full px-3 py-2 border border-gray-300 rounded-lg text-0 text-gray-900 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20 transition-all"
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
                className={`px-3 py-1 rounded-full border-1 text--1 transition-all text-center whitespace-nowrap ${
                  isActive
                    ? "border-maroon bg-maroon/10 text-maroon"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
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
