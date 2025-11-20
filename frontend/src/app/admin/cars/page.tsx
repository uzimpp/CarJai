"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import type {
  AdminManagedCar,
  AdminUpdateCarRequest,
  AdminCreateCarRequest,
} from "@/types/admin";
import PaginateControl from "@/components/ui/PaginateControl";

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Edit Car Modal Component
function EditCarModal({
  car,
  isOpen,
  onClose,
  onSave,
}: {
  car: AdminManagedCar | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (carId: number, data: AdminUpdateCarRequest) => Promise<void>;
}) {
  const [formData, setFormData] = useState<AdminUpdateCarRequest>({
    brandName: "",
    modelName: "",
    submodelName: "",
    year: undefined,
    price: 0,
    mileage: 0,
    status: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (car) {
      setFormData({
        brandName: car.brandName || "",
        modelName: car.modelName || "",
        submodelName: car.submodelName || "",
        year: car.year || undefined,
        price: car.price || 0,
        mileage: car.mileage || 0,
        status: car.status || "",
      });
      setError(null);
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

      await onSave(car.id, formData);
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
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.modelName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, modelName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Submodel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submodel
              </label>
              <input
                type="text"
                value={formData.submodelName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, submodelName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Price */}
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

            {/* Mileage */}
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

            {/* Status*/}
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

function AddCarModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdminCreateCarRequest) => Promise<void>;
}) {
  const [sellerIdInput, setSellerIdInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [sellerIdError, setSellerIdError] = useState<string | null>(null);
  const [validSellerId, setValidSellerId] = useState<number | null>(null);
  const [foundUserName, setFoundUserName] = useState(""); 

  // --- Debounce ---
  const debouncedSellerId = useDebounce(sellerIdInput, 500);
  const [formData, setFormData] = useState<Omit<AdminCreateCarRequest, 'sellerId'>>({
    brandName: "",
    modelName: "",
    submodelName: "",
    year: undefined,
    price: 0,
    mileage: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSellerId = async () => {
      if (debouncedSellerId.trim() === "") {
        setIsValidating(false);
        setSellerIdError(null);
        setValidSellerId(null);
        setFoundUserName("");
        return;
      }

      setIsValidating(true);
      setSellerIdError(null);
      setValidSellerId(null);
      setFoundUserName("");

      try {
        const response = await fetch(`/api/admin/users/${debouncedSellerId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User ID not found");
          }
          const errData = await response.json();
          throw new Error(errData.error || "Failed to check ID");
        }

        const user = await response.json();
        setValidSellerId(user.id);
        setFoundUserName(user.name); 
        setSellerIdError(null);

      } catch (err) {
        setValidSellerId(null);
        setSellerIdError(err instanceof Error ? err.message : "Invalid ID");
      } finally {
        setIsValidating(false);
      }
    };

    if (isOpen) {
      checkSellerId();
    }
  }, [debouncedSellerId, isOpen]); 


  useEffect(() => {
    if (isOpen) {
      setFormData({
        brandName: "",
        modelName: "",
        submodelName: "",
        year: undefined,
        price: 0,
        mileage: 0,
        status: "",
      });
      setError(null);
      setSellerIdInput("");
      setIsValidating(false);
      setSellerIdError(null);
      setValidSellerId(null);
      setFoundUserName("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validSellerId) {
      setSellerIdError("A valid Seller ID is required.");
      setError(null); 
      return;
    }
    setIsSaving(true);
    setError(null);

    const payload: AdminCreateCarRequest = {
      ...formData,
      sellerId: validSellerId,
      brandName: formData.brandName || undefined,
      modelName: formData.modelName || undefined,
      submodelName: formData.submodelName || undefined,
      year: formData.year || undefined,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create car");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Add New Car</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seller ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller ID (User ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="Enter the User ID of the seller"
                value={sellerIdInput}
                onChange={(e) =>
                  setSellerIdInput(e.target.value)
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  sellerIdError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-maroon"
                }`}
                required
              />

              {/* --- Inline Error / Loading / Success --- */}
              <div className="mt-1 text-sm h-5">
                {isValidating && (
                  <p className="text-gray-500">Checking...</p>
                )}
                {sellerIdError && (
                  <p className="text-red-600">{sellerIdError}</p>
                )}
                {!isValidating && validSellerId && foundUserName && (
                  <p className="text-green-600">✓ User found: {foundUserName}</p>
                )}
               </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                value={formData.brandName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.modelName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, modelName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Submodel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submodel
              </label>
              <input
                type="text"
                value={formData.submodelName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, submodelName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    year: parseInt(e.target.value) || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent"
              />
            </div>

            {/* Price */}
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

            {/* Mileage */}
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
                disabled={isSaving || isValidating}
                className="flex-1 px-4 py-2 bg-maroon text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {isSaving ? "Creating..." : (isValidating ? "Validating..." : "Create Car")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteCarModal({
  car,
  isOpen,
  onClose,
  onConfirm,
}: {
  car: AdminManagedCar | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (carId: number) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !car) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(car.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete car");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Delete Car</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isDeleting}
            >
              <svg>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-700">
              Are you sure you want to delete this car?
            </p>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <strong>ID:</strong> {car.id} <br />
              <strong>Car:</strong> {car.brandName || "N/A"}{" "}
              {car.modelName || ""}
            </div>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                No, Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
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
  const [cars, setCars] = useState<AdminManagedCar[]>([]);
  const [filteredCars, setFilteredCars] = useState<AdminManagedCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingCar, setEditingCar] = useState<AdminManagedCar | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingCar, setDeletingCar] = useState<AdminManagedCar | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load cars from API
  useEffect(() => {
    if (authLoading) return;

    const fetchCars = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // API Call
        const response = await fetch("/api/admin/cars");
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch cars");
        }

        const result = await response.json();

        if (result.success) {
          // Extract cars and total from result.data (wrapped response)
          const responseData = result.data as
            | { cars?: AdminManagedCar[]; total?: number }
            | AdminManagedCar[]
            | undefined;

          if (Array.isArray(responseData)) {
            // If result.data is directly an array (legacy format)
            setCars(responseData);
            setTotal(responseData.length);
          } else if (responseData && "cars" in responseData) {
            // If result.data is an object with cars and total
            const carsData = Array.isArray(responseData.cars)
              ? responseData.cars
              : [];
            setCars(carsData);
            setTotal(responseData.total ?? carsData.length);
          } else {
            setCars([]);
            setTotal(0);
          }
        } else {
          throw new Error(result.message || "Failed to load cars");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, [authLoading]);

  // Filter cars based on search and status
  useEffect(() => {
    // Ensure cars is always an array to prevent "not iterable" errors
    if (!Array.isArray(cars)) {
      setFilteredCars([]);
      return;
    }

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
  const handleEditCar = (car: AdminManagedCar) => {
    setEditingCar(car);
    setIsEditModalOpen(true);
  };

  const handleSaveCar = async (carId: number, data: AdminUpdateCarRequest) => {
    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || `Failed to update car: ${response.statusText}`
        );
      }

      const updatedCarPublic = await response.json();

      setCars((prevCars) =>
        prevCars.map((car) => {
          if (car.id !== carId) return car;
          return {
            ...car,
            brandName: updatedCarPublic.brandName,
            modelName: updatedCarPublic.modelName,
            submodelName: updatedCarPublic.submodelName,
            year: updatedCarPublic.year,
            price: updatedCarPublic.price,
            mileage: updatedCarPublic.mileage,
            status: updatedCarPublic.status,
          };
        })
      );
    } catch (err) {
      console.error("Failed to update car:", err);
      throw err;
    }
  };

  const handleCreateCar = async (data: AdminCreateCarRequest) => {
    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create car");
      }

      const newCar = await response.json();

      const newManagedCar: AdminManagedCar = {
        id: newCar.id,
        brandName: newCar.brandName,
        modelName: newCar.modelName,
        submodelName: newCar.submodelName,
        year: newCar.year,
        price: newCar.price,
        mileage: newCar.mileage,
        status: newCar.status,
        listedDate: newCar.createdAt,
        soldBy: `User ID: ${newCar.sellerId}`,
      };

      setCars((prevCars) => [newManagedCar, ...prevCars]);
    } catch (err) {
      console.error("Failed to create car:", err);
      throw err;
    }
  };

  const handleOpenDeleteModal = (car: AdminManagedCar) => {
    setDeletingCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCar = async (carId: number) => {
    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to delete car`);
      }

      setCars((prevCars) => prevCars.filter((car) => car.id !== carId));
    } catch (err) {
      console.error("Failed to delete car:", err);
      throw err;
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
          <button
            onClick={() => setIsAddModalOpen(true)}
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
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-gray-600 text-lg font-medium">
                  No cars found
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
                      {car.soldBy || "N/A"}
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
                      {formatDate(car.listedDate)}
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
                        Sold by: {car.soldBy || "N/A"}
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
                        {formatDate(car.listedDate)}
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
                        onClick={() => handleOpenDeleteModal(car)}
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

      <AddCarModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateCar}
      />

      <DeleteCarModal
        car={deletingCar}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCar}
      />
    </div>
  );
}
