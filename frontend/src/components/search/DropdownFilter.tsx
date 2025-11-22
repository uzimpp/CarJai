"use client";

interface DropdownOption {
  code: string;
  label: string;
}

interface DropdownFilterProps {
  label: string;
  value: string | number | undefined;
  options: DropdownOption[];
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  allOptionLabel?: string;
}

export default function DropdownFilter({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  allOptionLabel = "All",
}: DropdownFilterProps) {
  return (
    <div>
      <label className="block text--1 font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : undefined)}
        className="w-full px-(--space-s) py-(--space-xs) border border-gray-300 rounded-lg text-0 text-gray-900 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/20 transition-all bg-white"
      >
        <option value="">{allOptionLabel}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
