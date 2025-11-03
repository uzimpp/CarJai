"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles, validateSession } =
    useUserAuth();

  // If authenticated but roles are missing, try refreshing the session
  useEffect(() => {
    if (isAuthenticated && !isLoading && !roles?.buyer) {
      validateSession();
    }
  }, [isAuthenticated, isLoading, roles, validateSession]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/signin?redirect=/favorites");
        return;
      }

      if (!roles?.buyer) {
        router.push("/signup/role/buyer");
        return;
      }

      if (roles.buyer && !profiles?.buyerComplete) {
        router.push("/signup/role/buyer");
        return;
      }
    }
  }, [isAuthenticated, isLoading, roles, profiles, router]);

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

  if (!isAuthenticated || !roles?.buyer || !profiles?.buyerComplete) {
    return null;
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <h1 className="text-2 font-bold text-maroon mb-(--space-m)">
        My Favorites
      </h1>

      {/* Placeholder for favorites list - replace with real data */}
      <div className="rounded-xl border border-gray-200 bg-white p-(--space-l)">
        <p className="text-0 text-gray-600">
          Your saved cars will appear here. Start exploring on the Buy page and
          tap the heart to save favorites.
        </p>
      </div>
    </div>
  );
}
