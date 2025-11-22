"use client";

import { useRouter, usePathname } from "next/navigation";
import { useComparison } from "@/contexts/ComparisonContext";
import { Tooltip } from "react-tooltip";

export default function ComparisonButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { comparedCars } = useComparison();

  // Only show comparison bar on specific routes
  const allowedRoutes = ["/browse", "/favorites", "/history"];
  const isSellerProfile = pathname?.startsWith("/seller/");
  const shouldShow = allowedRoutes.includes(pathname || "") || isSellerProfile;

  if (comparedCars.length === 0 || !shouldShow) {
    return null;
  }

  const handleCompare = () => {
    router.push("/compare");
  };

  const isDisabled = comparedCars.length < 2;
  const tooltipId = "comparison-button-tooltip";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Compact Floating Button */}
      <button
        onClick={handleCompare}
        disabled={isDisabled}
        data-tooltip-id={tooltipId}
        data-tooltip-content={
          isDisabled
            ? "You need at least 2 cars to compare"
            : "Compare selected cars"
        }
        className="group flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-maroon text-white rounded-full shadow-lg transition-all duration-300 ease-in hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:opacity-60 disabled:hover:bg-black disabled:hover:opacity-60"
        aria-label="Compare cars"
      >
        <svg
          className="w-8 h-8 text-white transition-colors disabled:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.4}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <span className="font-medium whitespace-nowrap">
          Comparing {comparedCars.length}/3
        </span>
      </button>
      <Tooltip
        id={tooltipId}
        place="top"
        className="!bg-gray-900 !text-white !text-sm !px-3 !py-2 !rounded-lg !shadow-lg !z-[60]"
        style={{
          backgroundColor: "#111827",
          color: "#ffffff",
          fontSize: "0.875rem",
          padding: "0.5rem 0.75rem",
          borderRadius: "0.5rem",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
      />
    </div>
  );
}
