import type { Step } from "@/types/selling";

/**
 * Ordered list of steps in the selling flow
 */
export const STEP_ORDER: Step[] = ["documents", "specs", "pricing", "review"];

/**
 * Step display labels
 */
export const STEP_LABELS: Record<Step, string> = {
  documents: "Documents",
  specs: "Specifications",
  pricing: "Pricing & Images",
  review: "Review & Publish",
  success: "Success",
};

/**
 * Step descriptions
 */
export const STEP_DESCRIPTIONS: Record<Step, string> = {
  documents:
    "Upload your vehicle registration book and inspection report. The chassis numbers must match to continue.",
  specs:
    "Select the specifications for your vehicle including body type, transmission, drivetrain, fuel type, and model details.",
  pricing:
    "Set your asking price, upload 5-12 high-quality images, write a description, and disclose any damage history.",
  review:
    "Review all information and make any final edits before publishing your listing.",
  success: "Your listing has been successfully published!",
};

/**
 * Gets the index of a step in the step order
 * @param step - The step to get the index for
 * @returns The index of the step (0-based)
 */
export function getStepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step);
}

/**
 * Gets the next step in the flow
 * @param currentStep - The current step
 * @returns The next step, or null if at the end
 */
export function getNextStep(currentStep: Step): Step | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1];
}

/**
 * Gets the previous step in the flow
 * @param currentStep - The current step
 * @returns The previous step, or null if at the beginning
 */
export function getPreviousStep(currentStep: Step): Step | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1];
}

/**
 * Checks if a step is completed based on the current step
 * @param step - The step to check
 * @param currentStep - The current step
 * @returns true if the step is completed
 */
export function isStepCompleted(step: Step, currentStep: Step): boolean {
  return getStepIndex(step) < getStepIndex(currentStep);
}
