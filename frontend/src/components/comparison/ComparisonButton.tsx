"use client";

import { useRouter, usePathname } from "next/navigation";
import { useComparison } from "@/contexts/ComparisonContext";

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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Compact Floating Button */}
      <button
        onClick={handleCompare}
        disabled={comparedCars.length < 2}
        className="group flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-maroon text-white rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-gray-900 disabled:hover:border-gray-200"
        aria-label="Compare cars"
      >
        <svg
          className="w-8 h-8 text-white transition-colors"
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
    </div>
  );
}
