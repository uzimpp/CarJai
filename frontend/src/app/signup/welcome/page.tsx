"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function PostSignupNextPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();
  const { roles } = useUserAuth();

  const handleNavigation = (path: string, label: string) => {
    setSelectedOption(label);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to CarJai
          </h1>
          <p className="text-gray-600 text-lg">
            What would you like to do next?
          </p>
        </div>

        {selectedOption && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-sm">
            Selected: <strong>{selectedOption}</strong>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Selling */}
          <button
            type="button"
            onClick={() => handleNavigation(roles?.seller ? "/sell" : "/signup/role/seller", "Start Selling")}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🚗
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Start Selling
              </h2>
            </div>
            <p className="text-gray-600">
              Become a seller and list your car with verified details.
            </p>
          </button>

          {/* Browse Cars */}
          <button
            type="button"
            onClick={() => handleNavigation("/buy", "Browse Cars")}
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
            <p className="text-gray-600">
              Explore verified listings and find the right car for you.
            </p>
          </button>

          {/* See Guides */}
          <button
            type="button"
            onClick={() => handleNavigation("/guides", "See Guides")}
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                📘
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                See Guides
              </h2>
            </div>
            <p className="text-gray-600">
              Learn how selling and buying work on CarJai step by step.
            </p>
          </button>
        </div>

        {/* Secondary links */}
        <div className="mt-10 text-center text-gray-600">
          Head back to the{" "}
          <Link href="/" className="text-red-900 hover:underline font-semibold">
            home page
          </Link>.
        </div>
      </div>
    </div>
  );
}