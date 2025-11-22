// src/components/ui/ComboboxInput.tsx
import { useState, Fragment, useRef, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

interface ComboboxInputProps {
  label: string;
  value: string; // The selected value from page.tsx
  onChange: (value: string) => void; // The update function for page.tsx
  options: string[]; // The list from API
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}

export default function ComboboxInput({
  label,
  value,
  onChange,
  options = [], // Default to empty array if prop is null/undefined
  placeholder,
  disabled = false,
  loading = false,
  required = false,
}: ComboboxInputProps) {
  // (1) Internal state for filtering as the user types
  const [query, setQuery] = useState("");
  const openStateRef = useRef(false);
  const shouldClearQueryRef = useRef(false);

  // Clear query when combobox opens (transitions from closed to open)
  useEffect(() => {
    if (shouldClearQueryRef.current && query !== "") {
      setQuery("");
      shouldClearQueryRef.current = false;
    }
  }, [query]);

  // (2) Filter logic is now based on the *internal* query state
  const filteredOptions =
    query === ""
      ? options // If query is empty (on click), show all options
      : options.filter((option) =>
          option.toLowerCase().includes(query.toLowerCase())
        );

  // (3) Logic to allow custom values
  const hasExactMatch = options.some(
    (opt) => opt.toLowerCase() === query.toLowerCase()
  );
  const showCustomValue = query !== "" && !hasExactMatch;

  return (
    <div className="w-full">
      <Combobox
        value={value}
        // (4) This updates the *external* state (page.tsx) when an option is *selected*
        onChange={(newValue) => onChange(newValue ?? "")}
        disabled={disabled || loading}
      >
        {({ open }) => {
          // Track when combobox opens (transitions from closed to open)
          if (open && !openStateRef.current) {
            shouldClearQueryRef.current = true;
          }
          openStateRef.current = open;

          return (
            <>
              {label && (
                <Combobox.Label className="block text-0 font-medium text-gray-700 mb-1">
                  {label}
                  {required && <span className="text-red-600 ml-1">*</span>}
                </Combobox.Label>
              )}
              <div className="relative">
                <Combobox.Input
                  className={clsx(
                    "appearance-none relative block w-full px-3 py-2 text-0 border rounded-lg text-gray-900 placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-colors",
                    disabled || loading
                      ? "bg-gray-50 opacity-50 cursor-not-allowed border-gray-300"
                      : "bg-white border-gray-300"
                  )}
                  // (5) This shows the *selected* value (from page.tsx state)
                  displayValue={() => value}
                  // (6) This updates the *internal* query state as the user types
                  onChange={(event) => {
                    setQuery(event.target.value);
                    // (V4.1) Also update the *external* state immediately on type
                    // This allows the user to type a custom value and have it save
                    onChange(event.target.value);
                  }}
                  onFocus={() => {
                    setQuery(""); // Clear query on focus to show all options
                  }}
                  onClick={() => {
                    setQuery(""); // Clear query on click to show all options
                  }}
                  placeholder={loading ? "Loading..." : placeholder}
                  autoComplete="off"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-2 focus:outline-none disabled:cursor-not-allowed">
                  {loading ? (
                    <svg
                      className="h-5 w-5 animate-spin text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                  ) : (
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                </Combobox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  // (7) Reset internal query when the box closes
                  afterLeave={() => setQuery("")}
                >
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-0 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* (8) Show the custom value as an option if it's typed */}
                    {showCustomValue && (
                      <Combobox.Option
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-maroon text-white" : "text-gray-900"
                          }`
                        }
                        value={query} // The value is the typed query
                      >
                        {({ active }) => (
                          <span className="block truncate">
                            {query}
                            <span
                              className={clsx(
                                "ml-2 text--1",
                                active ? "text-white/70" : "text-gray-500"
                              )}
                            >
                              (Custom)
                            </span>
                          </span>
                        )}
                      </Combobox.Option>
                    )}

                    {/* (9) Map the *filtered* options (based on internal query) */}
                    {filteredOptions.length > 0
                      ? filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active
                                  ? "bg-maroon text-white"
                                  : "text-gray-900"
                              }`
                            }
                            value={option}
                          >
                            {({ selected, active }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? "font-medium" : "font-normal"
                                  }`}
                                >
                                  {option}
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                      active ? "text-white" : "text-maroon"
                                    }`}
                                  >
                                    <CheckIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      : // Show "Nothing found" only if query is typed and no results
                        query !== "" &&
                        !showCustomValue && (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700 text-0">
                            Nothing found.
                          </div>
                        )}
                  </Combobox.Options>
                </Transition>
              </div>
            </>
          );
        }}
      </Combobox>
    </div>
  );
}
