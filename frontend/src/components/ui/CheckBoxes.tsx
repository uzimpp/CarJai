import { useId } from "react";
import { ReactNode } from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { CheckIcon } from "@heroicons/react/24/outline";

export interface CheckOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface CheckBoxesProps<T extends string | number> {
  name: string;
  label?: string;
  description?: string;
  values: ReadonlyArray<T> | null | undefined;
  options: ReadonlyArray<CheckOption<T>>;
  onChange: (values: T[]) => void;
  direction?: "row" | "column";
  disabled?: boolean;
  error?: string;
  columns?: number; // For grid layout when icons are present
  required?: boolean;
}

export function CheckBoxes<T extends string | number>({
  name,
  label,
  description,
  values,
  options,
  onChange,
  direction = "column",
  disabled = false,
  error,
  columns,
  required = false,
}: CheckBoxesProps<T>) {
  const groupId = useId();
  const selected = new Set((values ?? []) as ReadonlyArray<T>);
  const hasIcons = options.some((opt) => opt.icon);

  const toggle = (val: T) => {
    const next = new Set(selected);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    onChange(Array.from(next));
  };

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

      <fieldset
        aria-describedby={description ? `${groupId}-desc` : undefined}
        disabled={disabled}
        className="border-none p-0 m-0"
      >
        <div className={getLayoutClass()}>
          {options.map((option) => {
            const id = `${groupId}-${String(option.value)}`;
            const checked = selected.has(option.value);
            const isDisabled = disabled || option.disabled;

            // Icon layout (grid with icon above label)
            if (hasIcons && option.icon) {
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={(e) => {
                    // Prevent form submission and scroll behavior for icon selectors
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) {
                      toggle(option.value);
                    }
                  }}
                  onFocus={(e) => {
                    // Prevent scroll when button receives focus
                    const target = e.target as HTMLElement;
                    if (target && typeof target.scrollIntoView === "function") {
                      target.scrollIntoView = () => {};
                    }
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    checked
                      ? "border-maroon bg-maroon/10 shadow-sm scale-[1.02]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-pressed={checked}
                  aria-label={option.label}
                >
                  <input
                    type="checkbox"
                    id={id}
                    name={name}
                    value={String(option.value)}
                    checked={checked}
                    disabled={isDisabled}
                    onChange={() => {
                      // Handled by button onClick
                    }}
                    className="sr-only"
                    tabIndex={-1}
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
                </button>
              );
            }

            // Standard layout (checkbox with label)
            return (
              <label
                key={String(option.value)}
                htmlFor={id}
                onClick={(e) => {
                  // Prevent form submission and scroll behavior
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
                <Checkbox.Root
                  id={id}
                  name={name}
                  checked={checked}
                  disabled={isDisabled}
                  onCheckedChange={() => {
                    if (!isDisabled) {
                      toggle(option.value);
                    }
                  }}
                  onFocus={(e) => {
                    // Prevent scroll when input receives focus
                    const target = e.target as HTMLElement;
                    if (target && typeof target.scrollIntoView === "function") {
                      target.scrollIntoView = () => {};
                    }
                  }}
                  className="mt-0.5 flex h-4 w-4 items-center justify-center rounded border-2 border-gray-300 bg-white transition-all hover:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-maroon data-[state=checked]:bg-maroon"
                >
                  <Checkbox.Indicator className="flex items-center justify-center text-white">
                    <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
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
      </fieldset>

      {error && (
        <p className="text--1 text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default CheckBoxes;
