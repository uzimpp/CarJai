"use client";

import { usePathname } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useUserAuth();

  // Determine current step based on pathname
  const getCurrentStep = () => {
    if (pathname === "/signup") return 1;
    if (pathname === "/signup/role") return 2;
    if (pathname.startsWith("/signup/role/")) return 3;
    return 1;
  };

  const currentStep = getCurrentStep();

  // Don't show step indicator on the initial signup page for unauthenticated users
  const showSteps = isAuthenticated || pathname !== "/signup";

  return (
    <div className="flex flex-col px-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Step Indicator */}
      {showSteps && (
        <div className="fixed top-0 left-0 py-(--space-xs-s) mx-auto w-full bg-white border-b border-gray-200">
          <div className="flex items-start px-(--space-m-xl) max-w-xl mx-auto w-full">
            {/* Step 1: Account */}
            <div className="flex flex-col items-center">
              <div
                className={`w-(--space-m) h-(--space-m) rounded-full flex items-center justify-center text--1 font-semibold transition-all duration-200 ${
                  currentStep > 1
                    ? "bg-green-500 text-white"
                    : currentStep === 1
                    ? "bg-black text-white ring-4 ring-black/20"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? (
                  <svg
                    className="w-(--space-s) h-(--space-s)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  "1"
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium transition-colors ${
                  currentStep >= 1 ? "text-gray-900" : "text-gray-400"
                }`}
              >
                Account
              </span>
            </div>

            {/* Connector Line 1-2 */}
            <div className="flex items-center flex-1 pt-(--space-xs) px-2">
              <div
                className={`w-full h-1 rounded transition-colors duration-300 ${
                  currentStep >= 2
                    ? currentStep === 2
                      ? "bg-black"
                      : "bg-green-500/60"
                    : "bg-gray-200"
                }`}
              />
            </div>

            {/* Step 2: Role */}
            <div className="flex flex-col items-center">
              <div
                className={`w-(--space-m) h-(--space-m) rounded-full flex items-center justify-center text--1 font-semibold transition-all duration-200 ${
                  currentStep > 2
                    ? "bg-green-500 text-white"
                    : currentStep === 2
                    ? "bg-black text-white ring-4 ring-black/20"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 2 ? (
                  <svg
                    className="w-(--space-s) h-(--space-s)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  "2"
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium transition-colors ${
                  currentStep >= 2 ? "text-gray-900" : "text-gray-400"
                }`}
              >
                Role
              </span>
            </div>

            {/* Connector Line 2-3 */}
            <div className="flex items-center flex-1 pt-(--space-xs) px-2">
              <div
                className={`w-full h-1 rounded transition-colors duration-300 ${
                  currentStep >= 3
                    ? currentStep === 3
                      ? "bg-black/60"
                      : "bg-green-500/60"
                    : "bg-gray-200"
                }`}
              />
            </div>

            {/* Step 3: Profile */}
            <div className="flex flex-col items-center">
              <div
                className={`w-(--space-m) h-(--space-m) rounded-full flex items-center justify-center text--1 font-semibold transition-all duration-200 ${
                  currentStep > 3
                    ? "bg-green-500 text-white"
                    : currentStep === 3
                    ? "bg-black text-white ring-4 ring-black/20"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {currentStep > 3 ? (
                  <svg
                    className="w-(--space-s) h-(--space-s)"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  "3"
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium transition-colors ${
                  currentStep >= 3 ? "text-gray-900" : "text-gray-400"
                }`}
              >
                Profile
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="!my-(--space-l) flex justify-center max-w-2xl h-full mx-auto">
        {children}
      </section>
    </div>
  );
}
