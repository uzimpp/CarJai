"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type { CarListing } from "@/types/car";
import PaginateControl from "@/components/ui/PaginateControl";

// Edit Car Modal Component
function EditCarModal({
  car,
  isOpen,
  onClose,
  onSave,
}: {
  car: CarListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carId: number, data: Partial<CarListing>) => void;
}) {
  const [formData, setFormData] = useState({
    price: 0,
    mileage: 0,
    status: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (car) {
      setFormData({
        price: car.price || 0,
        mileage: car.mileage || 0,
        status: car.status || "",
        description: "",
      });
    }
  }, [car]);

  if (!isOpen || !car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await updateCar(car.id, formData);

      onSave(car.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update car");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Car</h2>
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Car:</span> {car.brandName}{" "}
              {car.modelName} {car.submodelName}
            </p>
            {car.year && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Year:</span> {car.year}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (฿)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage (km)
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mileage: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent bg-white"
                required
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-maroon text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminCarsPage() {
  const { loading: authLoading, isAuthenticated } = useAdminAuth();
  const [cars, setCars] = useState<CarListing[]>([]);
  const [filteredCars, setFilteredCars] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingCar, setEditingCar] = useState<CarListing | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load cars from API
  useEffect(() => {
    if (authLoading) return;

    const fetchCars = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await fetch('/admin/cars', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //   },
        // });
        // if (!response.ok) throw new Error('Failed to fetch cars');
        // const data = await response.json();
        // setCars(data.cars);
        // setTotal(data.total);

        // For now, set empty state
        setCars([]);
        setTotal(0);
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setIsLoading(false);
      }
    };

    fetchCars();
  }, [authLoading]);

  // Filter cars based on search and status
  useEffect(() => {
    let filtered = [...cars];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (car) =>
          car.brandName?.toLowerCase().includes(query) ||
          car.modelName?.toLowerCase().includes(query) ||
          car.submodelName?.toLowerCase().includes(query) ||
          car.id.toString().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((car) => car.status === statusFilter);
    }

    setFilteredCars(filtered);
  }, [cars, searchQuery, statusFilter]);

  // Show loading while authentication is being checked
  if (authLoading || isAuthenticated === null) {
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

  // If not authenticated, don't render anything (redirect will happen in admin layout)
  if (isAuthenticated === false) {
    return null;
  }

  // Handle edit car
  const handleEditCar = (car: CarListing) => {
    setEditingCar(car);
    setIsEditModalOpen(true);
  };

  const handleSaveCar = async (carId: number, data: Partial<CarListing>) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/admin/cars/${carId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(data),
      // });

      // For now, update local state
      setCars((prevCars) =>
        prevCars.map((car) => {
          if (car.id !== carId) return car;
          return { ...car, ...data };
        })
      );
    } catch (err) {
      console.error("Failed to update car:", err);
      throw err;
    }
  };

  const handleDeleteCar = async (carId: number) => {
    if (!confirm("Are you sure you want to delete this car listing?")) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await fetch(`/admin/cars/${carId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //   },
      // });

      // For now, update local state
      setCars((prevCars) => prevCars.filter((car) => car.id !== carId));
    } catch (err) {
      console.error("Failed to delete car:", err);
      alert("Failed to delete car. Please try again.");
    }
  };

  // Pagination
  const totalRows = filteredCars.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      case "deleted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full flex flex-col gap-(--space-s-m)">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-(--space-2xs)">
        <div>
          <h1 className="text-3 bold">Car Management</h1>
        </div>
        <div className="flex flex-row justify-end items-center gap-2">
          <button className="flex-1 px-4 py-2 bg-maroon text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Car
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
              placeholder="Search by brand, model, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="sold">Sold</option>
              <option value="deleted">Deleted</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)]">
          <div className="divide-y divide-gray-200">
            {/* Column Headers - Hidden on mobile, visible on md+ */}
            <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_80px] gap-(--space-2xs) p-(--space-xs) bg-gray-50 rounded-t-lg">
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Submodel
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Sold By
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Status
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider">
                Listed Date
              </div>
              <div className="text--1 font-medium text-gray-500 uppercase tracking-wider flex justify-center">
                Actions
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mb-4"></div>
                  <p className="text-gray-600">Loading cars...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 text-lg font-medium">
                  No cars found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "API integration pending. Connect to /admin/cars endpoint to display car data."}
                </p>
              </div>
            ) : paginatedCars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No cars found on this page</p>
              </div>
            ) : (
              <>
                {paginatedCars.map((car) => (
                  <div
                    key={car.id}
                    className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_1fr_1fr_1fr_80px] gap-(--space-2xs) p-(--space-xs) transition-colors items-center hover:bg-gray-50"
                  >
                    {/* Brand - hidden on mobile, visible on md+ */}
                    <div className="hidden md:block">
                      <div className="text--1 font-medium text-gray-900">
                        {car.brandName || "N/A"}
                      </div>
                      {car.modelName && (
                        <div className="text--1 text-gray-500">
                          {car.modelName}
                        </div>
                      )}
                    </div>

                    {/* Submodel - hidden on mobile, visible on md+ */}
                    <div className="hidden md:block text--1 text-gray-900">
                      {car.submodelName || "N/A"}
                    </div>

                    {/* Sold By - hidden on mobile, visible on md+ */}
                    <div className="hidden md:block text--1 text-gray-500">
                      {/* TODO: Replace with actual seller username from API */}
                      @seller{car.sellerId}
                    </div>

                    {/* Status - hidden on mobile, visible on md+ */}
                    <div className="hidden md:block">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          car.status
                        )}`}
                      >
                        {car.status.charAt(0).toUpperCase() +
                          car.status.slice(1)}
                      </span>
                    </div>

                    {/* Listed Date - hidden on mobile, visible on md+ */}
                    <div className="hidden md:block text--1 text-gray-500">
                      {formatDate(car.createdAt)}
                    </div>

                    {/* Mobile view - Brand, Submodel, Sold By, Status, Date */}
                    <div className="md:hidden flex flex-col gap-(--space-3xs)">
                      <div className="text--1 font-medium text-gray-900">
                        {car.brandName || "N/A"}{" "}
                        {car.modelName && `• ${car.modelName}`}
                      </div>
                      <div className="text--1 text-gray-500">
                        {car.submodelName || "N/A"}
                      </div>
                      <div className="text--1 text-gray-500">
                        Sold by: @seller{car.sellerId}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeColor(
                          car.status
                        )}`}
                      >
                        {car.status.charAt(0).toUpperCase() +
                          car.status.slice(1)}
                      </span>
                      <span className="text-gray-500 text--1">
                        {formatDate(car.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-(--space-3xs) justify-self-center">
                      <button
                        type="button"
                        onClick={() => handleEditCar(car)}
                        className="p-(--space-2xs) rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                        aria-label={`Edit car ${car.id}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCar(car.id)}
                        className="p-(--space-2xs) rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                        aria-label={`Delete car ${car.id}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.4}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {filteredCars.length > 0 && (
          <div className="flex justify-end mt-(--space-m)">
            <PaginateControl
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </section>

      {/* Edit Car Modal */}
      <EditCarModal
        car={editingCar}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCar(null);
        }}
        onSave={handleSaveCar}
      />
    </div>
  );
}
