import { useId } from "react";
import { ReactNode } from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface ChoicesProps<T extends string | number> {
  name: string;
  label?: string;
  description?: string;
  value: T | null | undefined;
  options: ReadonlyArray<ChoiceOption<T>>;
  onChange: (value: T) => void;
  direction?: "row" | "column";
  required?: boolean;
  disabled?: boolean;
  error?: string;
  columns?: number; // For grid layout when icons are present
}

export function Choices<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
  direction = "column",
  required = false,
  disabled = false,
  error,
  columns,
}: ChoicesProps<T>) {
  const groupId = useId();
  const hasIcons = options.some((opt) => opt.icon);
  const stringValue = value?.toString() || "";

  // Determine layout class
  const getLayoutClass = () => {
    if (hasIcons && columns) {
      const gridColsClass =
        columns === 2
          ? "grid-cols-2"
          : columns === 3
          ? "grid-cols-3"
          : columns === 4
          ? "grid-cols-4"
          : "grid-cols-3";
      return `grid ${gridColsClass} gap-3`;
    }
    return direction === "row" ? "flex gap-3 flex-wrap" : "space-y-2";
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-0 font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p id={`${groupId}-desc`} className="text--1 text-gray-500 mb-3">
          {description}
        </p>
      )}

      <RadioGroup.Root
        value={stringValue}
        onValueChange={(val) => onChange(val as T)}
        disabled={disabled}
        aria-describedby={description ? `${groupId}-desc` : undefined}
        className="w-full"
      >
        <div className={getLayoutClass()}>
          {options.map((option) => {
            const id = `${groupId}-${String(option.value)}`;
            const checked = value === option.value;
            const isDisabled = disabled || option.disabled;
            const optionValue = String(option.value);

            // Icon layout (grid with icon above label)
            if (hasIcons && option.icon) {
              return (
                <label
                  key={String(option.value)}
                  htmlFor={id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) {
                      onChange(option.value);
                    }
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    checked
                      ? "border-maroon bg-maroon/10 shadow-sm scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <RadioGroup.Item
                    value={optionValue}
                    id={id}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  <div
                    className={`transition-colors duration-200 ${
                      checked ? "text-maroon" : "text-gray-600"
                    }`}
                  >
                    {option.icon}
                  </div>
                  <span
                    className={`text--1 text-center transition-colors duration-200 ${
                      checked ? "text-maroon font-medium" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </span>
                </label>
              );
            }

            // Standard layout (radio with label)
            return (
              <label
                key={String(option.value)}
                htmlFor={id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
                  checked
                    ? "border-maroon bg-maroon/5 shadow-sm"
                    : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RadioGroup.Item
                  value={optionValue}
                  id={id}
                  disabled={isDisabled}
                  className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition-all hover:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-maroon"
                >
                  <RadioGroup.Indicator className="flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-maroon" />
                  </RadioGroup.Indicator>
                </RadioGroup.Item>
                <div className="flex-1 min-w-0">
                  <div className="text-0 text-gray-900 font-medium">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text--1 text-gray-600 mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </RadioGroup.Root>

      {error && (
        <p className="text--1 text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Choices;
