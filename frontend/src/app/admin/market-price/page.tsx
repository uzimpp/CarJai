"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminAuthAPI } from "@/lib/adminAuth";

// Interface MarketPrice
interface MarketPrice {
  brand: string;
  model: string;
  sub_model: string;
  year_start: number;
  year_end: number;
  price_min_thb: number;
  price_max_thb: number;
  created_at?: string;
  updated_at?: string;
}

// Type for status messages
interface StatusResponse {
  message: string;
  error?: string;
}

// Type for JSON error structure
interface GoErrorResponse {
  success: boolean;
  error: string;
  code: number;
}

// Type for successful import response
interface ImportSuccessResponse {
  message: string;
  inserted_count: number;
  updated_count: number;
}

// Upload Modal Component
function UploadModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<StatusResponse | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(null);
    setUploadStatus(null);

    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].type === "application/pdf") {
        setSelectedFile(event.target.files[0]);
      } else {
        setUploadStatus({
          message: "",
          error: "Invalid file type. Please select a PDF file.",
        });
        event.target.value = "";
      }
    }
  };

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadStatus({
        message: "",
        error: "Please select a PDF file first.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await adminAuthAPI.importMarketPrices(selectedFile);
      setUploadStatus({
        message: `${result.message} Inserted: ${result.inserted_count}, Updated: ${result.updated_count}`,
        error: undefined,
      });
      // Clear file after successful import
      setSelectedFile(null);
      const fileInput = document.getElementById(
        "pdf-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Network or other error during import:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown network error occurred";
      setUploadStatus({ message: "", error: `Import Error: ${errorMessage}` });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Market Price PDF
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleUploadSubmit}>
            <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <label
                htmlFor="pdf-upload"
                className="block text-sm font-medium text-gray-700 mb-2 cursor-pointer"
              >
                Choose a PDF file
              </label>
              <input
                id="pdf-upload"
                name="marketPricePdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">PDF only, up to 50MB</p>
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {uploadStatus && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  uploadStatus.error
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}
              >
                {uploadStatus.error || uploadStatus.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Importing..." : "Upload and Import"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MarketPricePage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();

  // Data display states
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fetch market prices
  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await adminAuthAPI.getMarketPrices();
      setPrices(data || []);
      setFilteredPrices(data || []);
    } catch (err) {
      console.error("Error fetching market prices:", err);
      // Set empty arrays instead of error for initial load
      setPrices([]);
      setFilteredPrices([]);
      setError(null); // Don't show error, just empty state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authLoading && isAuthenticated) {
      fetchPrices();
    }
  }, [authLoading, isAuthenticated]);

  // Search filtering
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPrices(prices);
      setPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = prices.filter(
      (price) =>
        price.brand.toLowerCase().includes(query) ||
        price.model.toLowerCase().includes(query) ||
        price.sub_model.toLowerCase().includes(query) ||
        price.year_start.toString().includes(query) ||
        price.year_end.toString().includes(query)
    );
    setFilteredPrices(filtered);
    setPage(1);
  }, [searchQuery, prices]);

  // Pagination
  const totalPages = Math.ceil(filteredPrices.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPrices = filteredPrices.slice(startIndex, endIndex);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

  const formatYearRange = (start: number, end: number) => {
    return start === end ? `${start}` : `${start}-${end}`;
  };

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Page Header */}
      <div className="flex flex-row justify-between items-center gap-(--space-2xs)">
        <div>
          <h1 className="text-3 font-bold">Market Prices</h1>
        </div>
        <div className="flex flex-row justify-end items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 px-4 py-2 bg-maroon text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload PDF
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-(--space-s-m)">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-(--space-s)">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <input
              type="text"
              placeholder="Search by brand, model, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all"
            />
          </div>

          {/* Result Count */}
          <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 font-medium whitespace-nowrap">
            Total: {filteredPrices.length} prices
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)]">
          <div className="divide-y divide-gray-200">
            {/* Column Headers - Hidden on mobile, visible on md+ */}
            <div className="hidden md:grid md:grid-cols-[1.5fr_1.5fr_1fr_1.2fr_1.2fr] gap-(--space-2xs) p-(--space-xs) bg-gray-50 rounded-t-lg">
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Model
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Sub Model
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Year Range
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider text-right">
                Price Range (THB)
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mb-4"></div>
                  <p className="text-gray-600">Loading prices...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : paginatedPrices.length === 0 ? (
              <div className="text-center py-12 px-4">
                {searchQuery ? (
                  <p className="text-gray-500">
                    No prices found matching your search
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-gray-900 font-medium mb-1">
                        No market prices available
                      </p>
                      <p className="text-gray-500 text-sm">
                        Please upload market price data from The Department of
                        Land Transport
                      </p>
                    </div>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-2 px-4 py-2 bg-maroon text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload PDF
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {paginatedPrices.map((price, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_1.2fr_1.2fr] gap-(--space-2xs) p-(--space-xs) transition-colors hover:bg-gray-50"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-(--space-3xs)">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text--1 font-semibold text-gray-900">
                            {price.brand}
                          </div>
                          <div className="text--1 text-gray-600">
                            {price.model} {price.sub_model}
                          </div>
                        </div>
                        <div className="text--1 text-gray-500">
                          {formatYearRange(price.year_start, price.year_end)}
                        </div>
                      </div>
                      <div className="text--1 font-medium text-maroon">
                        ฿{formatPrice(price.price_min_thb)} - ฿
                        {formatPrice(price.price_max_thb)}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:block text--1 text-gray-900 font-medium">
                      {price.brand}
                    </div>
                    <div className="hidden md:block text--1 text-gray-900">
                      {price.model}
                    </div>
                    <div className="hidden md:block text--1 text-gray-600">
                      {price.sub_model}
                    </div>
                    <div className="hidden md:block text--1 text-gray-500">
                      {formatYearRange(price.year_start, price.year_end)}
                    </div>
                    <div className="hidden md:block text--1 text-gray-900 text-right font-medium">
                      ฿{formatPrice(price.price_min_thb)} - ฿
                      {formatPrice(price.price_max_thb)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !error && filteredPrices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-(--space-xs) p-(--space-m) border-t border-gray-200">
              <div className="text--1 text-gray-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredPrices.length)} of{" "}
                {filteredPrices.length} prices
              </div>
              <div className="flex items-center gap-(--space-2xs)">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-(--space-xs) py-(--space-2xs) border border-gray-300 rounded-lg text--1 font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-(--space-xs) text--1 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-(--space-xs) py-(--space-2xs) border border-gray-300 rounded-lg text--1 font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchPrices}
      />
    </div>
  );
}
