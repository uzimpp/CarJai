// Utility exports
export { debounce } from "./debounce";
export {
  isDescriptionValid,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isPriceValid,
  isMileageValid,
} from "./carValidation";
export {
  STEP_ORDER,
  STEP_LABELS,
  STEP_DESCRIPTIONS,
  getStepIndex,
  getNextStep,
  getPreviousStep,
  isStepCompleted,
} from "./stepNavigation";

export {
  getTimeRemaining,
  isSessionExpiringSoon,
  getTimeDifference,
} from "./timeUtils";
