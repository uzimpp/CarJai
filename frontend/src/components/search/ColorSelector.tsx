"use client";

interface ColorOption {
  code: string;
  label: string;
}

interface ColorSelectorProps {
  options: ColorOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  colorMap: Record<string, string[]>; // Array of hex colors (single color = [hex], multicolor = [hex1, hex2, hex3])
}

export default function ColorSelector({
  options,
  selectedValues,
  onChange,
  colorMap,
}: ColorSelectorProps) {
  const handleClick = (code: string) => {
    const isSelected = selectedValues.includes(code);
    const newValues = isSelected
      ? selectedValues.filter((v) => v !== code)
      : [...selectedValues, code];
    onChange(newValues);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {options.map((color) => {
          const isSelected = selectedValues.includes(color.code);
          const colorArray = colorMap[color.code] || ["#6B7280"];
          const isMulticolor = colorArray.length > 1;
          const colorHex = colorArray[0]; // First color for single colors

          return (
            <button
              key={color.code}
              type="button"
              onClick={() => handleClick(color.code)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              aria-label={color.label}
            >
              <div
                className={`w-8 h-8 rounded-full transition-all transform relative border-2 overflow-hidden ${
                  isSelected
                    ? "border-gray-300 group-hover:border-gray-300 scale-105"
                    : "border-gray-200 group-hover:border-gray-300"
                }`}
                style={{
                  backgroundColor: isMulticolor ? "transparent" : colorHex,
                  boxShadow: isSelected
                    ? "0 2px 8px rgba(133, 29, 21, 0.3)"
                    : "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                {isMulticolor ? (
                  // Multi-color swatch with up to 3 colors
                  // Using negative margins to extend beyond border and cover gaps
                  <div className="absolute -inset-[1px] flex overflow-hidden rounded-full">
                    {colorArray.slice(0, 3).map((col, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-full"
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                ) : null}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* Dark circle background for better contrast */}
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white drop-shadow-lg"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <span className="text--1 text-gray-700 text-center">
                {color.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
