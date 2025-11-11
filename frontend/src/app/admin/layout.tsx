"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAdminAuth();

  // Skip auth check for signin page
  const isSigninPage = pathname === "/admin/signin";

  useEffect(() => {
    // Only redirect if we're done loading and definitely not authenticated
    if (!isSigninPage && !loading && isAuthenticated === false) {
      router.push("/admin/signin");
    }
  }, [loading, isAuthenticated, router, isSigninPage]);

  // Show loading while authentication is being checked (skip for signin page)
  if (!isSigninPage && (loading || isAuthenticated === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <div className="text-lg mb-2">Checking permissions...</div>
          <div className="text-sm text-gray-500">Please wait</div>
        </div>
      </div>
    );
  }

  // If not authenticated and not on signin, don't render anything (redirect will happen)
  if (!isSigninPage && isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
}
