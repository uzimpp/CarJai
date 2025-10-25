// Car interface for car card
export default interface CarListing {
  id: number;
  sellerId?: number;
  brandName?: string;
  modelName?: string;
  year?: number;
  price: number;
  mileage?: number;
  provinceId?: number;
  conditionRating?: number;
  bodyType?: string; // Display label from backend (e.g., "Pickup")
  transmission?: string; // Display label from backend (e.g., "Manual")
  fuelTypes?: string[]; // Display labels from backend (e.g., ["Gasoline", "LPG"])
  drivetrain?: string; // Display label from backend (e.g., "FWD")
  seats?: number;
  doors?: number;
  colors?: string[]; // Display labels from backend (e.g., ["White", "Gray"])
  status: string;
  images?: Array<{ id: number }>;
  createdAt?: string;
  updatedAt?: string;
}

// For full car data matching with the DB attributes - Updated to receive display labels
export interface CarData {
  id: number;
  sellerId?: number;
  brandName?: string;
  modelName?: string;
  year?: number;
  price: number;
  mileage?: number;
  provinceId?: number;
  conditionRating?: number;
  bodyType?: string; // Display label from backend (e.g., "Pickup")
  transmission?: string; // Display label from backend (e.g., "Manual")
  fuelTypes?: string[]; // Display labels from backend (e.g., ["Gasoline", "LPG"])
  drivetrain?: string; // Display label from backend (e.g., "FWD")
  seats?: number;
  doors?: number;
  colors?: string[]; // Display labels from backend (e.g., ["White", "Gray"])
  status: string;
  images?: Array<{ id: number }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedCarsResponse {
  success: boolean;
  data: {
    cars: CarListing[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface InspectionData {
  [key: string]: string;
}

// Form data type with text fields for user input (frontend → backend)
export interface CarFormData {
  // Step 1
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  mileage?: number;
  year?: number;
  seats?: number;
  doors?: number;
  engineCc?: number;

  // Step 2
  bodyTypeName?: string;
  transmissionName?: string;
  drivetrainName?: string;
  fuelTypes?: string[];
  isFlooded?: boolean;
  isHeavilyDamaged?: boolean;

  // Step 3
  images?: File[];
  price?: number;
  description?: string;
  conditionRating?: number;
}
