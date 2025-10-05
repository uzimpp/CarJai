"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import DocumentUploader from "@/components/features/ocr/DocumentUploader";

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();

  // Redirect logic for seller guard
  useEffect(() => {
    if (!isLoading) {
      // Not authenticated → redirect to login
      if (!isAuthenticated) {
        router.push("/login?redirect=/sell");
        return;
      }

      // Authenticated but no seller role → redirect to role selection or seller signup
      if (roles && !roles.seller) {
        router.push("/signup/role/seller");
        return;
      }

      // Has seller role but incomplete profile → redirect to seller signup
      if (roles && roles.seller && profiles && !profiles.sellerComplete) {
        router.push("/signup/role/seller");
        return;
      }
    }
  }, [isAuthenticated, isLoading, roles, profiles, router]);

  // Show loading while checking auth
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

  // Don't render if not authenticated or not a complete seller
  if (!isAuthenticated || !roles?.seller || !profiles?.sellerComplete) {
    return null;
  }

  return (
    <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto w-full">
      <h1 className="text-2 font-bold text-maroon mb-(--space-m)">Sell Cars</h1>
      <DocumentUploader />
    </div>
  );
}
