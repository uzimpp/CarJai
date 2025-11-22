"use client";

interface DropdownOption {
  code: string;
  label: string;
}

interface DropdownFilterProps {
  value: string | number | undefined;
  options: DropdownOption[];
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  allOptionLabel?: string;
}

export default function DropdownFilter({
  value,
  options,
  onChange,
  allOptionLabel = "All",
}: DropdownFilterProps) {
  return (
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
  );
}
