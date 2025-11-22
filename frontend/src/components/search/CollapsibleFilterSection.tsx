"use client";

import { useState } from "react";

interface CollapsibleFilterSectionProps {
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  hasActiveFilter?: boolean;
}

export default function CollapsibleFilterSection({
  label,
  children,
  defaultExpanded = true,
  hasActiveFilter = false,
}: CollapsibleFilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-100 flex flex-col py-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-0 hover:opacity-80 transition-opacity"
      >
        <span className="block text--1 semi-bold text-grey text-left">
          {label}
        </span>
        <svg
          className={`w-5 h-5 text-grey transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-4 text--1">{children}</div>
      </div>
    </div>
  );
}
