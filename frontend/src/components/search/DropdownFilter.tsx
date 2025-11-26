"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

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

const ALL_OPTION_VALUE = "__all__";

export default function DropdownFilter({
  value,
  options,
  onChange,
  allOptionLabel = "All",
}: DropdownFilterProps) {
  // Use special value for "all" option, or the actual value
  const selectValue = value?.toString() || ALL_OPTION_VALUE;
  const displayValue = value
    ? options.find((opt) => opt.code === value.toString())?.label ||
      allOptionLabel
    : allOptionLabel;

  const handleValueChange = (val: string) => {
    if (val === ALL_OPTION_VALUE) {
      onChange(undefined);
    } else {
      onChange(val);
    }
  };

  return (
    <Select.Root value={selectValue} onValueChange={handleValueChange}>
      <Select.Trigger
        className="inline-flex items-center justify-between w-full px-(--space-s) py-(--space-xs) text-0 text-gray-900 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        onFocus={(e) => {
          // Prevent scroll when select receives focus
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          // Prevent scroll when clicking select
          e.stopPropagation();
        }}
      >
        <Select.Value>{displayValue}</Select.Value>
        <Select.Icon className="text-gray-500">
          <ChevronDownIcon className="w-4 h-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[var(--radix-select-trigger-width)] max-h-[300px]"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value={ALL_OPTION_VALUE}
              className="relative flex items-center pl-8 pr-3 py-2 text-0 text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
            >
              <Select.ItemIndicator className="absolute left-2 flex items-center justify-center w-4">
                <CheckIcon className="w-4 h-4 text-maroon" />
              </Select.ItemIndicator>
              <Select.ItemText>{allOptionLabel}</Select.ItemText>
            </Select.Item>
            {options.map((option) => (
              <Select.Item
                key={option.code}
                value={option.code}
                className="relative flex items-center pl-8 pr-3 py-2 text-0 text-gray-900 rounded-md cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <Select.ItemIndicator className="absolute left-2 flex items-center justify-center w-4">
                  <CheckIcon className="w-4 h-4 text-maroon" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
