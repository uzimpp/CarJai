"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import Link from "next/link";

function RoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, roles } = useUserAuth();
  const from = searchParams.get("from");

  // Redirect to signin if not authenticated
  // But give a small grace period for auth state to load after signup
  useEffect(() => {
    // If coming directly from signup, skip the auto-redirect guard
    if (from === "signup") {
      return;
    }

    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/signin");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router, from]);

  // If user already has both roles, redirect to appropriate page
  useEffect(() => {
    if (roles && (roles.buyer || roles.seller)) {
      // User already has at least one role, they might be coming back to add another
      // Don't redirect them automatically, let them choose
    }
  }, [roles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full p-(--space-s-m)">
      {/* Header */}
      <div className="text-center mb-(--space-m-l)">
        <h1 className="text-4 font-bold text-gray-900 line-height-12">
          Choose Your Role
        </h1>
        <p className="text-0 text-gray-600 ">
          Select how you&apos;d like to use CarJai
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 gap-(--space-m)">
        {/* Buyer Card */}
        <Link href="/signup/role/buyer" className="block group">
          <div className="border-2 border-gray-200 rounded-xl p-(--space-l) hover:border-maroon hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div className="mb-(--space-m)">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-maroon/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-black group-hover:text-maroon transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
                  I&apos;m a Buyer
                </h2>
                <p className="text-0 text-gray-600 mb-(--space-s)">
                  Looking to find the perfect car
                </p>
                <ul className="text--1 text-gray-600 space-y-(--space-3xs)">
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Browse car listings
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Filter by budget and location
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Contact sellers directly
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="mt-(--space-m) flex justify-center p-(--space-3xs) bg-black group-hover:bg-maroon rounded-xl transition-all duration-300">
                <svg
                  className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Seller Card */}
        <Link href="/signup/role/seller" className="block group">
          <div className="border-2 border-gray-200 rounded-xl p-(--space-l) hover:border-maroon hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div className="mb-(--space-m)">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-maroon/20 transition-colors">
                  <svg
                    className="w-8 h-8 text-black group-hover:text-maroon transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
                  I&apos;m a Seller
                </h2>
                <p className="text-0 text-gray-600 mb-(--space-s)">
                  Ready to list and sell cars to buyers
                </p>
                <ul className="text--1 text-gray-600 space-y-(--space-3xs)">
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Create car listings
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Manage your dealership profile
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-4 h-4 text-maroon mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connect with potential buyers
                  </li>
                </ul>
              </div>

              {/* Arrow */}
              <div className="mt-(--space-m) flex justify-center p-(--space-3xs) bg-black group-hover:bg-maroon rounded-xl transition-all duration-300">
                <svg
                  className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Note */}
      {/* <p className="text--1 text-center text-gray-500 mt-(--space-m)">
          You can add or switch roles later in your settings
        </p> */}
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RoleSelectionContent />
    </Suspense>
  );
}
