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
  // Text fields for user input
  colors?: string[];
  prefix?: string;
  number?: string;
  provinceTh?: string;
  licensePlate?: string;
  bodyTypeName?: string;
  transmissionName?: string;
  drivetrainName?: string;
  fuelLabels?: string[];
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  description?: string;

  // Numbers
  mileage?: number;
  price?: number;
  conditionRating?: number;
  year?: number;
  seats?: number;
  doors?: number;
  engineCc?: number; // Can be decimal (1.5, 2.4) or whole number (1500, 2400)

  // Booleans
  isFlooded?: boolean;
  isHeavilyDamaged?: boolean;

  // Inspection fields (read-only from scrape) - Updated to use codes
  registrationNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  bodyStyle?: string;
  colorCodes?: string[]; // Changed from color (now array of codes)
  fuelTypeCodes?: string[]; // Changed from fuelTypeId (now array of codes)
  overallResult?: string;
  brakePerformance?: string;
  handbrakePerformance?: string;
  emissionValue?: string;
  noiseLevel?: string;
  brakeResult?: string;
  wheelAlignmentResult?: string;
  emissionResult?: string;
  chassisConditionResult?: string;
}
