"use client";

import { useState, useEffect } from "react";
import { BuyerRequest } from "@/constants/user";

interface BuyerFormProps {
  initialData?: BuyerRequest;
  onSubmit: (data: BuyerRequest) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

// Thai provinces list
const THAI_PROVINCES = [
  "Bangkok",
  "Amnat Charoen",
  "Ang Thong",
  "Bueng Kan",
  "Buriram",
  "Chachoengsao",
  "Chai Nat",
  "Chaiyaphum",
  "Chanthaburi",
  "Chiang Mai",
  "Chiang Rai",
  "Chonburi",
  "Chumphon",
  "Kalasin",
  "Kamphaeng Phet",
  "Kanchanaburi",
  "Khon Kaen",
  "Krabi",
  "Lampang",
  "Lamphun",
  "Loei",
  "Lopburi",
  "Mae Hong Son",
  "Maha Sarakham",
  "Mukdahan",
  "Nakhon Nayok",
  "Nakhon Pathom",
  "Nakhon Phanom",
  "Nakhon Ratchasima",
  "Nakhon Sawan",
  "Nakhon Si Thammarat",
  "Nan",
  "Narathiwat",
  "Nong Bua Lam Phu",
  "Nong Khai",
  "Nonthaburi",
  "Pathum Thani",
  "Pattani",
  "Phang Nga",
  "Phatthalung",
  "Phayao",
  "Phetchabun",
  "Phetchaburi",
  "Phichit",
  "Phitsanulok",
  "Phra Nakhon Si Ayutthaya",
  "Phrae",
  "Phuket",
  "Prachinburi",
  "Prachuap Khiri Khan",
  "Ranong",
  "Ratchaburi",
  "Rayong",
  "Roi Et",
  "Sa Kaeo",
  "Sakon Nakhon",
  "Samut Prakan",
  "Samut Sakhon",
  "Samut Songkhram",
  "Saraburi",
  "Satun",
  "Sing Buri",
  "Sisaket",
  "Songkhla",
  "Sukhothai",
  "Suphan Buri",
  "Surat Thani",
  "Surin",
  "Tak",
  "Trang",
  "Trat",
  "Ubon Ratchathani",
  "Udon Thani",
  "Uthai Thani",
  "Uttaradit",
  "Yala",
  "Yasothon",
];

export default function BuyerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
}: BuyerFormProps) {
  const [formData, setFormData] = useState<BuyerRequest>({
    province: initialData?.province || "",
    budgetMin: initialData?.budgetMin || null,
    budgetMax: initialData?.budgetMax || null,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autocomplete state
  const [provinceInput, setProvinceInput] = useState(
    initialData?.province || ""
  );
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [filteredProvinces, setFilteredProvinces] =
    useState<string[]>(THAI_PROVINCES);

  useEffect(() => {
    if (initialData) {
      setFormData({
        province: initialData.province || "",
        budgetMin: initialData.budgetMin || null,
        budgetMax: initialData.budgetMax || null,
      });
      setProvinceInput(initialData.province || "");
    }
  }, [initialData]);

  // Filter provinces based on input
  const handleProvinceInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setProvinceInput(value);

    // Filter provinces
    const filtered = THAI_PROVINCES.filter((province) =>
      province.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProvinces(filtered);
    setShowProvinceDropdown(true);

    // Update form data
    setFormData((prev) => ({
      ...prev,
      province: value,
    }));

    // Clear error
    if (formErrors.province) {
      setFormErrors((prev) => ({
        ...prev,
        province: "",
      }));
    }
  };

  // Select province from dropdown
  const handleProvinceSelect = (province: string) => {
    setProvinceInput(province);
    setFormData((prev) => ({
      ...prev,
      province: province,
    }));
    setShowProvinceDropdown(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "budgetMin" || name === "budgetMax") {
      const numValue = value === "" ? null : parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? null : value,
      }));
    }

    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (
      formData.budgetMin !== null &&
      formData.budgetMin !== undefined &&
      formData.budgetMin < 0
    ) {
      errors.budgetMin = "Budget minimum must be non-negative";
    }

    if (
      formData.budgetMin !== null &&
      formData.budgetMin !== undefined &&
      formData.budgetMax !== null &&
      formData.budgetMax !== undefined &&
      formData.budgetMin > formData.budgetMax
    ) {
      errors.budgetMax =
        "Budget maximum must be greater than or equal to minimum";
    }

    if (formData.province && formData.province.length > 100) {
      errors.province = "Province name must be 100 characters or less";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-(--space-m)">
      {/* Province Field - Autocomplete */}
      <div className="relative">
        <label
          htmlFor="province"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          Province
        </label>
        <input
          id="province"
          name="province"
          type="text"
          value={provinceInput}
          onChange={handleProvinceInputChange}
          onFocus={() => {
            setShowProvinceDropdown(true);
            setFilteredProvinces(THAI_PROVINCES);
          }}
          onBlur={() => {
            // Delay to allow click on dropdown item
            setTimeout(() => setShowProvinceDropdown(false), 200);
          }}
          placeholder="Type to search provinces..."
          disabled={isLoading || isSubmitting}
          autoComplete="off"
          className={`relative block w-full px-3 py-2 text-0 border ${
            formErrors.province
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        {/* Dropdown List */}
        {showProvinceDropdown && filteredProvinces.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredProvinces.map((province) => (
              <button
                key={province}
                type="button"
                onClick={() => handleProvinceSelect(province)}
                className="w-full text-left px-3 py-2 text-0 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                {province}
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showProvinceDropdown &&
          filteredProvinces.length === 0 &&
          provinceInput && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
              <p className="text-0 text-gray-500">No provinces found</p>
            </div>
          )}

        {formErrors.province && (
          <p className="mt-1 text--1 text-red-600">{formErrors.province}</p>
        )}
      </div>

      {/* Budget Min Field */}
      <div>
        <label
          htmlFor="budgetMin"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          Minimum Budget (THB)
        </label>
        <input
          id="budgetMin"
          name="budgetMin"
          type="number"
          min="0"
          step="10000"
          value={formData.budgetMin === null ? "" : formData.budgetMin}
          onChange={handleInputChange}
          placeholder="e.g., 500000"
          disabled={isLoading || isSubmitting}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border ${
            formErrors.budgetMin
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {formErrors.budgetMin && (
          <p className="mt-1 text--1 text-red-600">{formErrors.budgetMin}</p>
        )}
      </div>

      {/* Budget Max Field */}
      <div>
        <label
          htmlFor="budgetMax"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          Maximum Budget (THB)
        </label>
        <input
          id="budgetMax"
          name="budgetMax"
          type="number"
          min="0"
          step="10000"
          value={formData.budgetMax === null ? "" : formData.budgetMax}
          onChange={handleInputChange}
          placeholder="e.g., 1000000"
          disabled={isLoading || isSubmitting}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border ${
            formErrors.budgetMax
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {formErrors.budgetMax && (
          <p className="mt-1 text--1 text-red-600">{formErrors.budgetMax}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-x-(--space-s) justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
            className="px-(--space-m) py-(--space-2xs) border border-gray-300 text-0 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-(--space-m) py-(--space-2xs) border border-transparent text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-(--space-s) w-(--space-s) border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
