// src/components/global/ComboboxInput.tsx
import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface ComboboxInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function ComboboxInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  loading = false,
}: ComboboxInputProps) {
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="w-full">
      {/* This is the fixed line.
        We wrap `onChange` to handle the `null` case from Headless UI.
        If `newValue` is `null`, we pass `""` (empty string) instead.
      */}
      <Combobox 
        value={value} 
        onChange={(newValue) => onChange(newValue ?? "")} 
        disabled={disabled || loading}
      >
        <Combobox.Label className="block text-sm font-medium text-gray-700">
          {label}
        </Combobox.Label>
        <div className="relative mt-1">
          <Combobox.Input
            className={clsx(
              "w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm",
              "focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm",
              disabled ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""
            )}
            displayValue={(option: string) => option}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={loading ? "Loading..." : placeholder}
            autoComplete="off"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none disabled:cursor-not-allowed">
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            )}
          </Combobox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-red-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option}
                        </span>
                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-red-600'}`}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}