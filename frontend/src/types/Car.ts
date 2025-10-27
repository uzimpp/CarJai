// Car interface for car card
export interface CarListing {
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

export interface Car {
  car: CarData;
  images: ImageMetadata[];
  inspection: InspectionData;
}
// For full car data matching with the DB attributes - Updated to receive display labels
export interface CarData {
  id: number;
  sellerId: number;
  status: string;

  bodyType?: string; // Display label from backend (e.g., "Pickup")
  transmission?: string; // Display label from backend (e.g., "Manual")
  drivetrain?: string; // Display label from backend (e.g., "FWD")
  fuelTypes?: string[]; // Display labels from backend (e.g., ["Gasoline", "LPG"])
  colors?: string[]; // Display labels from backend (e.g., ["White", "Gray"])
  year?: number;
  mileage?: number;
  price?: number;
  prefix?: string;
  number?: string;
  province?: string;
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  description?: string;

  chassisNumber?: string;
  licensePlate?: string;

  seats?: number;
  doors?: number;
  engineCc?: number;

  conditionRating?: number;
  isFlooded: boolean;
  isHeavilyDamaged: boolean;

  createdAt: string;
}

export interface ImageMetadata {
  id: number;
  carId: number;
  imageType: string;
  imageSize: number;
  displayOrder: number;
  uploadedAt: string;
  url: string; // URL to fetch/display the image: /api/cars/images/{id}
}

export interface InspectionData {
  station: string;
  overallPass: boolean;
  brakeResult: boolean;
  handbrakeResult: boolean;
  alignmentResult: boolean;
  noiseResult: boolean;
  emissionResult: boolean;
  hornResult: boolean;
  speedometerResult: boolean;
  highLowBeamResult: boolean;
  signalLightsResult: boolean;
  otherLightsResult: boolean;
  windshieldResult: boolean;
  steeringResult: boolean;
  wheelsTiresResult: boolean;
  fuelTankResult: boolean;
  chassisResult: boolean;
  bodyResult: boolean;
  doorsFloorResult: boolean;
  seatbeltResult: boolean;
  wiperResult: boolean;
}

// Form data type with text fields for user input (frontend → backend)
export interface CarFormData {
  // Step 1 - Basic Info
  brandName?: string;
  modelName?: string;
  submodelName?: string;
  mileage?: number;
  year?: number;
  seats?: number;
  doors?: number;
  engineCc?: number;

  // From Inspection uploaded (read-only fields)
  chassisNumber?: string;
  licensePlate?: string;
  colors?: string[];
  prefix?: string;
  number?: string;
  province?: string;

  // Inspection Results (read-only fields)
  station?: string;
  overallPass?: boolean;
  brakeResult?: boolean;
  handbrakeResult?: boolean;
  alignmentResult?: boolean;
  noiseResult?: boolean;
  emissionResult?: boolean;
  hornResult?: boolean;
  speedometerResult?: boolean;
  highLowBeamResult?: boolean;
  signalLightsResult?: boolean;
  otherLightsResult?: boolean;
  windshieldResult?: boolean;
  steeringResult?: boolean;
  wheelsTiresResult?: boolean;
  fuelTankResult?: boolean;
  chassisResult?: boolean;
  bodyResult?: boolean;
  doorsFloorResult?: boolean;
  seatbeltResult?: boolean;
  wiperResult?: boolean;

  // Step 2
  bodyTypeName?: string;
  transmissionName?: string;
  drivetrainName?: string;
  fuelLabels?: string[]; // Maps to backend fuelLabels (e.g., ["Gasoline", "LPG"])
  isFlooded?: boolean;
  isHeavilyDamaged?: boolean;
  conditionRating?: number;

  // Step 3
  images?: File[];
  price?: number;
  description?: string;

  // UI State (not sent to backend)
  imagesUploaded?: boolean;
}

export interface BookResult {
  brandName?: string;
  year?: number;
  engineCc?: number;
  seats?: number;
}

export interface InspectionResult {
  chassisNumber: string;
  mileage: number;
  colors: string[];
  prefix: string;
  number: string;
  provinceTh: string;
  licensePlate: string;

  station: string;
  overallPass: boolean;
  brakeResult: boolean;
  handbrakeResult: boolean;
  alignmentResult: boolean;
  noiseResult: boolean;
  emissionResult: boolean;
  hornResult: boolean;
  speedometerResult: boolean;
  highLowBeamResult: boolean;
  signalLightsResult: boolean;
  otherLightsResult: boolean;
  windshieldResult: boolean;
  steeringResult: boolean;
  wheelsTiresResult: boolean;
  fuelTankResult: boolean;
  chassisResult: boolean;
  bodyResult: boolean;
  doorsFloorResult: boolean;
  seatbeltResult: boolean;
  wiperResult: boolean;
}
