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
  bodyTypeId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  drivetrainId?: number;
  seats?: number;
  doors?: number;
  color?: string;
  status: string;
  images?: Array<{ id: number }>;
  createdAt?: string;
  updatedAt?: string;
}

// For full car data matching with the DB attributes
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
  bodyTypeId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  drivetrainId?: number;
  seats?: number;
  doors?: number;
  color?: string;
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
  prefix?: string;
  number?: string;
  provinceNameTh?: string;
  bodyTypeName?: string;
  transmissionName?: string;
  drivetrainName?: string;
  fuelLabels?: string[];
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
  engineCc?: number;

  // Booleans
  isFlooded?: boolean;
  isHeavilyDamaged?: boolean;

  // Inspection fields (read-only from scrape)
  registrationNumber?: string;
  vin?: string;
  engineNumber?: string;
  bodyStyle?: string;
  color?: string;
  fuelTypeId?: number;
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
