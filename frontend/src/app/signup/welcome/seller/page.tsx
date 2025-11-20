"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function SellerWelcomePage() {
  const { isLoading, isAuthenticated, roles, profiles, validateSession } =
    useUserAuth();

  // If authenticated but roles are missing, try refreshing the session
  useEffect(() => {
    if (isAuthenticated && !isLoading && !roles?.seller) {
      validateSession().catch((error) => {
        console.debug("Session validation error (handled):", error);
      });
    }
  }, [isAuthenticated, isLoading, roles, validateSession]);

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

  if (!isAuthenticated || !roles?.seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be a registered seller to access this page.
          </p>
          <Link
            href="/signup/role/seller"
            className="inline-block bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 transition-colors"
          >
            Become a Seller
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome, Car Seller! 🚗
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to start selling? Here&apos;s what you can do:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Complete Profile */}
          <Link
            href={
              profiles?.sellerComplete ? "/settings" : "/signup/role/seller"
            }
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left inline-block w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profiles?.sellerComplete
                  ? "Manage Profile"
                  : "Complete Profile"}
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              {profiles?.sellerComplete
                ? "Update your seller information and settings."
                : "Complete your seller profile to start listing cars."}
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>
                • {profiles?.sellerComplete ? "Update" : "Add"} contact
                information
              </li>
              <li>
                • {profiles?.sellerComplete ? "Manage" : "Set up"} dealership
                details
              </li>
              <li>
                • {profiles?.sellerComplete ? "Edit" : "Add"} location and bio
              </li>
            </ul>
            {!profiles?.sellerComplete && (
              <div className="mt-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Required to start selling
              </div>
            )}
          </Link>

          {/* Start Selling */}
          <Link
            href="/sell"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left inline-block w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                🚗
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Start Selling
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Create your first car listing with verified details.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Upload photos and details</li>
              <li>• Set your asking price</li>
              <li>• Publish to marketplace</li>
            </ul>
            {!profiles?.sellerComplete && (
              <div className="mt-3 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Complete profile first
              </div>
            )}
          </Link>

          {/* Selling Guides */}
          <Link
            href="/guides/seller"
            className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-red-800 transition-all hover:-translate-y-1 text-left inline-block w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                📘
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Selling Guides
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Learn how to sell cars effectively on CarJai.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• How to create great listings</li>
              <li>• Photography tips</li>
              <li>• Pricing strategies</li>
            </ul>
          </Link>
        </div>

        {/* Additional Options */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-red-800 hover:text-red-900 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
