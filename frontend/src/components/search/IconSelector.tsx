"use client";

interface IconOption {
  code: string;
  label: string;
  icon: React.ReactNode;
}

interface IconSelectorProps {
  options: IconOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  columns?: number;
}

export default function IconSelector({
  options,
  selectedValues,
  onChange,
  multiple = false,
  columns = 3,
}: IconSelectorProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    code: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (multiple) {
      const isSelected = selectedValues.includes(code);
      const newValues = isSelected
        ? selectedValues.filter((v) => v !== code)
        : [...selectedValues, code];
      onChange(newValues);
    } else {
      const isSelected = selectedValues.includes(code);
      onChange(isSelected ? [] : [code]);
    }
  };

  const gridColsClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
      ? "grid-cols-3"
      : columns === 4
      ? "grid-cols-4"
      : "grid-cols-3";

  return (
    <div className={`grid ${gridColsClass} gap-3`}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.code);
        return (
          <button
            key={option.code}
            type="button"
            onClick={(e) => handleClick(e, option.code)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              isSelected
                ? "border-maroon bg-maroon/10"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`${isSelected ? "text-maroon" : "text-gray-600"}`}>
              {option.icon}
            </div>
            <span
              className={`text--1 text-center ${
                isSelected ? "text-maroon font-medium" : "text-gray-700"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
