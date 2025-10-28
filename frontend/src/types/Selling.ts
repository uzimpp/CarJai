export type Step =
  | "documents" // Step 1: Upload book & inspection (chassis must match)
  | "specs" // Step 2: Choose body type, transmission, drivetrain, fuel, model, mileage
  | "pricing" // Step 3: Price, images, description, damage flags
  | "review" // Step 4: Review all with editable fields
  | "success"; // Success state after publishing
