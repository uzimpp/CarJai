"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Car,
  ShoppingCart,
  FileText,
  Settings,
  DollarSign,
  Eye,
  Search,
  Phone,
  Heart,
  GitCompare,
  CheckCircle2,
  Camera,
  Shield,
  Sparkles,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  tip?: string;
  important?: string;
}

export default function CarJaiGuides() {
  const [activeTab, setActiveTab] = useState<"seller" | "buyer">("seller");

  // Handle hash-based tab switching
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash === "seller" || hash === "buyer") {
      setActiveTab(hash);
    }

    // Also handle hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (newHash === "seller" || newHash === "buyer") {
        setActiveTab(newHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const sellerSteps: Step[] = [
    {
      id: 1,
      title: "Step 1: Documents",
      icon: FileText,
      description:
        "Upload registration book (optional) for auto-fill or inspection report QR/URL (required).",
      important: "Inspection report is required",
      tip: "Registration book saves time but can be skipped",
    },
    {
      id: 2,
      title: "Step 2: Vehicle Specifications",
      icon: Settings,
      description:
        "Select body type, transmission, drivetrain, fuel type, brand, model, year, mileage, and other specs.",
      important: "All fields required before publishing",
    },
    {
      id: 3,
      title: "Step 3: Pricing, Images & Description",
      icon: DollarSign,
      description:
        "Set price, upload 5-12 images, write description (10-200 chars), and disclose damage history.",
      important: "5-12 images required",
    },
    {
      id: 4,
      title: "Step 4: Review & Publish",
      icon: Eye,
      description:
        "Review all information, make final edits, and publish your listing.",
    },
  ];

  const sellerManagement = [
    {
      title: "Manage Your Listings",
      description: "View drafts, active, and sold cars in one place",
      icon: Car,
    },
    {
      title: "Update Anytime",
      description: "Edit price, details, or photos. Auto-saved.",
      icon: Settings,
    },
    {
      title: "Mark as Sold",
      description: "Mark sold to remove from search but keep in history",
      icon: CheckCircle2,
    },
  ];

  const buyerSteps: Step[] = [
    {
      id: 1,
      title: "Search & Filter",
      icon: Search,
      description:
        "Filter by price, year, mileage, body type, transmission, location, and more.",
    },
    {
      id: 2,
      title: "Browse & Compare",
      icon: GitCompare,
      description:
        "View listings with photos, specs, and inspection results. Compare up to 3 cars side-by-side.",
      tip: "Compare up to 3 cars at once",
    },
    {
      id: 3,
      title: "Save Favorites",
      icon: Heart,
      description: "Save cars to your favorites list for easy access later.",
    },
    {
      id: 4,
      title: "Contact the Seller",
      icon: Phone,
      description:
        "View seller profile with contact info and listing history. Reach out directly.",
    },
  ];

  const buyerFeatures = [
    {
      title: "Inspection Results",
      description:
        "View official inspection data including brakes, emissions, and lights.",
      icon: Shield,
    },
    {
      title: "Seller Profiles",
      description:
        "See listing history, sold cars count, and contact information.",
      icon: Car,
    },
    {
      title: "Price Estimates",
      description: "See estimated market prices for informed decisions.",
      icon: DollarSign,
    },
  ];

  const StepCard: React.FC<{ step: Step; index: number }> = ({
    step,
    index,
  }) => {
    const Icon = step.icon;
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-(--space-m) mb-(--space-s) border border-gray-100">
        <div className="flex items-start gap-(--space-m)">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-maroon rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
              {index + 1}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-maroon" />
                <h3 className="text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
              </div>
              {step.badge && (
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {step.badge}
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-3">
              {step.description}
            </p>

            {step.tip && (
              <div className="bg-maroon/10 border-l-4 border-maroon p-3 rounded-r mb-3">
                <p className="text-sm text-maroon">
                  <strong>Tip:</strong> {step.tip}
                </p>
              </div>
            )}

            {step.important && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r">
                <p className="text-sm text-orange-900">
                  <strong>Important:</strong> {step.important}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="mb-(--space-xl) text-center flex flex-col justify-center">
        <h1 className="text-5 bold">How It Works</h1>
        <p className="text-0 text-gray-600">
          Simple steps to buy or sell your car on CarJai
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Tab Buttons */}
        <div className="flex gap-(--space-s) mb-(--space-xl)">
          <button
            onClick={() => setActiveTab("seller")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-0 transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "seller"
                ? "bg-black text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
            }`}
          >
            <Car className="w-5 h-5" />
            Seller Guide
          </button>
          <button
            onClick={() => setActiveTab("buyer")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-0 transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === "buyer"
                ? "bg-black text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Buyer Guide
          </button>
        </div>

        {/* Seller Guide */}
        {activeTab === "seller" && (
          <div className="pb-(--space-2xl)" id="seller">
            {sellerSteps.map((step, idx) => (
              <StepCard key={step.id} step={step} index={idx} />
            ))}

            <div className="bg-white rounded-2xl shadow-sm p-(--space-xl) mt-(--space-l) border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-(--space-m)">
                After You Publish
              </h3>
              <div className="grid md:grid-cols-3 gap-(--space-m)">
                {sellerManagement.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="text-center p-(--space-m) bg-gray-50 rounded-xl"
                    >
                      <div className="flex justify-center mb-3">
                        <Icon className="w-8 h-8 text-maroon" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-maroon/10 border-2 border-maroon/20 rounded-2xl p-(--space-xl) mt-(--space-l)">
              <h3 className="text-xl font-bold text-maroon mb-(--space-m) flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Photo Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-(--space-s) text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Use good lighting (daytime)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Clean car before shooting</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Show all angles</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Highlight special features</span>
                </div>
              </div>
            </div>

            <div className="mt-(--space-xl) text-center">
              <Link
                href="/sell"
                className="inline-block bg-maroon hover:bg-red text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                Start Selling Your Car
              </Link>
            </div>
          </div>
        )}

        {/* Buyer Guide */}
        {activeTab === "buyer" && (
          <div className="pb-(--space-2xl)" id="buyer">
            {buyerSteps.map((step, idx) => (
              <StepCard key={step.id} step={step} index={idx} />
            ))}

            <div className="bg-white rounded-2xl shadow-sm p-(--space-xl) mt-(--space-l) border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-(--space-m) flex items-center gap-2">
                <Search className="w-6 h-6 text-maroon" />
                Search Tips
              </h3>
              <div className="space-y-(--space-s)">
                <div className="flex items-start gap-4 p-(--space-m) bg-gray-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-maroon flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Set Your Budget
                    </h4>
                    <p className="text-sm text-gray-600">
                      Use price filters to find affordable options
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-(--space-m) bg-gray-50 rounded-xl">
                  <Car className="w-6 h-6 text-maroon flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Filter by Location
                    </h4>
                    <p className="text-sm text-gray-600">
                      Find cars near you for easier viewing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-(--space-m) bg-gray-50 rounded-xl">
                  <Settings className="w-6 h-6 text-maroon flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Narrow Down
                    </h4>
                    <p className="text-sm text-gray-600">
                      Filter by body type, fuel, transmission
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-(--space-xl) mt-(--space-l) border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-(--space-m)">
                Additional Features
              </h3>
              <div className="grid md:grid-cols-3 gap-(--space-m)">
                {buyerFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="p-(--space-m) bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-maroon" />
                        <h4 className="font-semibold text-gray-900">
                          {feature.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-maroon/10 border-2 border-maroon/20 rounded-2xl p-(--space-xl) mt-(--space-l)">
              <h3 className="text-xl font-bold text-maroon mb-(--space-m) flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Safety Tips
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Meet in a public place for first viewing</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Bring someone with you</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Check VIN and registration documents</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Test drive before committing</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-maroon flex-shrink-0 mt-0.5" />
                  <span>Consider mechanic inspection</span>
                </p>
              </div>
            </div>

            <div className="mt-(--space-xl) text-center">
              <Link
                href="/browse"
                className="inline-block bg-maroon hover:bg-red text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                Start Browsing Cars
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
