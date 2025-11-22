"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Seller, SellerContact } from "@/types/user";
import type { CarListing } from "@/types/car";
import { profileAPI } from "@/lib/profileAPI";
import CarCard from "@/components/car/CarCard";
import { useUserAuth } from "@/hooks/useUserAuth";
import ReportModal from "@/components/reports/ReportModal";
import { reportsAPI } from "@/lib/reportsAPI";
import { DEFAULT_SELLER_SUBTOPICS } from "@/types/report";
import { FlagIcon } from "@heroicons/react/24/outline";

export default function SellerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [contacts, setContacts] = useState<SellerContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cars, setCars] = useState<CarListing[]>([]);
  const [notFoundState, setNotFoundState] = useState(false);
  const [isReportSellerOpen, setIsReportSellerOpen] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string>("");
  const { isAuthenticated, roles } = useUserAuth();
  const isBuyer = isAuthenticated && roles?.buyer;

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!id) return;
      setIsLoading(true);
      setNotFoundState(false);
      try {
        const sellerRes = await profileAPI.getSellerProfile(String(id));
        if (!mounted) return;
        setSeller(sellerRes.data.seller);
        setContacts(sellerRes.data.contacts || []);
        setCars(sellerRes.data.cars || []);
        setIsLoading(false);
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to load seller profile:", error);
        setNotFoundState(true);
        setIsLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [id]);

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

  if (notFoundState || !seller) {
    return (
      <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1200px] mx-auto w-full">
        <div className="rounded-xl border border-gray-200 bg-white p-(--space-l)">
          <h1 className="text-2 font-bold text-gray-900 mb-(--space-s)">
            Seller not found
          </h1>
          <p className="text-0 text-gray-600 mb-(--space-m)">
            The seller you are looking for does not exist or is unavailable.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center px-(--space-m) py-(--space-2xs) text-0 font-medium rounded-lg text-white bg-maroon hover:bg-red transition-colors"
          >
            Go to Browse
          </Link>
        </div>
      </div>
    );
  }

  const getContactIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "phone":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        );
      case "email":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "line":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
        );
      case "facebook":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case "instagram":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
          </svg>
        );
      case "website":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Hero */}
      <div className="bg-maroon text-white rounded-4xl">
        <div className="max-w-[1200px] mx-auto px-(--space-m) py-(--space-xl)">
          <div className="flex items-center gap-(--space-l)">
            <div className="w-24 h-24 rounded-full bg-white/10 ring-4 ring-white/20 flex items-center justify-center text-2xl font-bold">
              {seller.displayName?.[0] || "S"}
            </div>
            <div className="flex-1">
              <h1 className="text-5 font-bold leading-tight">
                {seller.displayName}
              </h1>
              {seller.about && (
                <p className="text-0 text-white/90 mt-(--space-2xs)">
                  {seller.about}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-(--space-m) py-(--space-xl)">
        <div className="grid md:grid-cols-3 gap-(--space-l)">
          {/* Main */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
              <h2 className="text-2 font-bold text-gray-900 mb-(--space-m)">
                Cars from {seller.displayName}
              </h2>
              {cars.length === 0 ? (
                <p className="text-0 text-gray-600">No active cars.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-m)">
                  {cars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-(--space-l) sticky top-(--space-l)">
              <h2 className="text-2 font-bold text-gray-900 mb-(--space-m)">
                Contact Information
              </h2>
              {contacts.length > 0 ? (
                <div className="space-y-(--space-s)">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-start p-(--space-s) rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 text-maroon mt-1">
                        {getContactIcon(contact.contactType)}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text--1 font-medium text-gray-900 capitalize">
                            {contact.contactType}
                          </p>
                          {contact.label && (
                            <span className="text--2 text-gray-500 ml-2">
                              ({contact.label})
                            </span>
                          )}
                        </div>
                        <p className="text-0 text-gray-600 break-all mt-1">
                          {contact.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text--1 text-gray-600">
                  No contact information available
                </p>
              )}

              {seller.mapLink && (
                <div className="mt-(--space-m)">
                  <a
                    href={seller.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-0 text-maroon hover:text-maroon-dark font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    View on Map
                  </a>
                </div>
              )}
              {isBuyer && (
                <button
                  onClick={() => setIsReportSellerOpen(true)}
                  className="mt-(--space-s) w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 border-[3px] border-rose-300 rounded-[14px] bg-transparent text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors text-base font-medium"
                >
                  <FlagIcon className="h-5 w-5" aria-hidden="true" />
                  Report Seller
                </button>
              )}
              {reportFeedback && (
                <div className="mt-(--space-s) text--1 text-green-700 bg-green-50 border border-green-200 rounded p-2">
                  {reportFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Report Modal */}
      <ReportModal
        isOpen={isReportSellerOpen}
        target="seller"
        onClose={() => setIsReportSellerOpen(false)}
        onSubmit={async (data) => {
          setReportFeedback("");
          try {
            const res = await reportsAPI.submitSellerReport(seller.id, data);
            if (res?.success) {
              setReportFeedback("Thanks! Your report has been submitted.");
            }
          } catch (e: unknown) {
            let msg = "Failed to submit seller report";
            if (typeof e === "object" && e !== null && "message" in e) {
              const m = (e as { message?: unknown }).message;
              if (typeof m === "string") msg = m;
            } else if (typeof e === "string") {
              msg = e;
            }
            setReportFeedback(msg);
            throw e;
          }
        }}
        suggestedSubtopics={DEFAULT_SELLER_SUBTOPICS as string[]}
      />
    </div>
  );
}
