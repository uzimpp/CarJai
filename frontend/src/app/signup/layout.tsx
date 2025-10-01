"use client";

import { usePathname } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";

interface Step {
  number: number;
  label: string;
  path: string;
}

const steps: Step[] = [
  { number: 1, label: "Account", path: "/signup" },
  { number: 2, label: "Role", path: "/signup/role" },
  { number: 3, label: "Profile", path: "/signup/role/" }, // matches both buyer and seller
];

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
    <div className="flex flex-col min-h-screen items-center justify-center px-(--space-m) max-w-[1536px] mx-auto w-full">
      {/* Step Indicator */}
      {showSteps && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-(--space-m) py-(--space-m)">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-0 font-semibold transition-all duration-200 ${
                        currentStep > step.number
                          ? "bg-green-500 text-white"
                          : currentStep === step.number
                          ? "bg-maroon text-white ring-4 ring-maroon/20"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {currentStep > step.number ? (
                        <svg
                          className="w-5 h-5"
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
                        step.number
                      )}
                    </div>
                    <span
                      className={`mt-2 text--1 font-medium transition-colors ${
                        currentStep >= step.number
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 mt-[-24px]">
                      <div
                        className={`h-full transition-colors duration-300 ${
                          currentStep > step.number
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-(--space-xl)">{children}</div>
    </div>
  );
}
