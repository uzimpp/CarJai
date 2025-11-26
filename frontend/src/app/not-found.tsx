"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NotFoundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { code, title, message } = useMemo(() => {
    const codeParam = searchParams.get("code");
    const parsedCode = codeParam ? parseInt(codeParam, 10) : 404;
    const safeCode = Number.isFinite(parsedCode) ? parsedCode : 404;

    const titleParam = searchParams.get("title");
    const messageParam = searchParams.get("message");

    return {
      code: safeCode,
      title:
        titleParam || (safeCode === 403 ? "Access Denied" : "Page Not Found"),
      message:
        messageParam ||
        (safeCode === 403
          ? "You don't have permission to access this resource"
          : "The page you're looking for doesn't exist or may have been moved"),
    };
  }, [searchParams]);

  const accent = useMemo(() => {
    // Use website theme colors (maroon/red/black/gray) for consistent look across the system
    return {
      ring: "ring-2 ring-maroon",
      text: "text-maroon",
      btn: "bg-maroon hover:bg-red",
      neutralText: "text-gray-600",
      headingText: "text-gray-900",
    } as const;
  }, []);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full min-h-[80vh] flex items-center justify-center">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-8 font-bold text-maroon mb-4">{code}</h1>
        <h2 className="text-4 font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-1 text-gray-600 mb-8 leading-relaxed">{message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push("/browse")}
            className="px-(--space-l) py-(--space-s) bg-white hover:bg-gray-50 text-maroon font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-maroon"
          >
            Browse Cars
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
