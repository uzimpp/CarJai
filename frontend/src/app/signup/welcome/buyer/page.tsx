"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function BuyerWelcomePage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();
  const { roles, isLoading, isAuthenticated } = useUserAuth();

  const handleNavigation = (path: string, label: string) => {
    setSelectedOption(label);
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roles?.buyer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be a registered buyer to access this page.</p>
          <Link 
            href="/signup/role/buyer"
            className="inline-block bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 transition-colors"
          >
            Become a Buyer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome, Car Buyer! 🚗
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to find your perfect car? Here&apos;s what you can do:
          </p>
        </div>

        {selectedOption && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-sm">
            Selected: <strong>{selectedOption}</strong>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Browse Cars */}
          <button
            type="button"
            onClick={() => handleNavigation("/browse", "Browse Cars")}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🔎
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Browse Cars
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Explore verified listings and find the right car for you.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Filter by price, location, and features</li>
              <li>• View detailed photos and specifications</li>
              <li>• Contact sellers directly</li>
            </ul>
          </button>

          {/* Buying Guides */}
          <button
            type="button"
            onClick={() => handleNavigation("/guides?tab=buyer", "Buying Guides")}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                📘
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Buying Guides
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Learn how to buy cars safely and smartly on CarJai.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• How to search and filter effectively</li>
              <li>• What to look for in listings</li>
              <li>• Tips for contacting sellers</li>
            </ul>
          </button>
        </div>

        {/* Additional Options */}
        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="inline-block text-red-800 hover:underline font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}