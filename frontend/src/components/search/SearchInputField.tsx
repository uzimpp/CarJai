"use client";

import { forwardRef } from "react";

interface SearchInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
}

const SearchInputField = forwardRef<HTMLInputElement, SearchInputFieldProps>(
  function SearchInputField(
    {
      value,
      onChange,
      placeholder = "Search cars, brands, models...",
      className = "",
      inputClassName = "",
      onKeyDown,
      onFocus,
    },
    ref
  ) {
    const handleClear = () => {
      onChange("");
    };

    return (
      <div
        className={`flex flex-row w-full rounded-full items-center bg-white border border-gray-200 focus-within:border-maroon focus-within:ring-2 focus-within:ring-maroon/20 transition-all !${className}`}
      >
        <div className="flex items-center">
          <button
            type="submit"
            className="rounded-full mx-(--space-2xs) px-(--space-3xs) py-(--space-3xs) text-maroon transition-colors hover:bg-maroon/20 focus:outline-none"
            aria-label="Search"
          >
            <svg
              className="w-(--space-s) h-(--space-s)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          className={`w-full flex my-(--space-2xs) text-gray-900 focus:outline-none bg-transparent ${inputClassName}`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full mr-(--space-2xs) p-(--space-3xs) text-maroon/80 bg-maroon/10 hover:text-white hover:bg-maroon transition-colors focus:outline-none"
            aria-label="Clear search"
          >
            <svg
              className="w-(--space-s) h-(--space-s)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

export default SearchInputField;
