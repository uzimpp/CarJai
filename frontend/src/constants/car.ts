import type { CheckOption } from "@/components/ui/CheckBoxes";

// Damage Options
export const DAMAGE_OPTIONS: CheckOption<string>[] = [
  {
    value: "flooded",
    label: "Flooded Vehicle",
    description: "This vehicle has been damaged by flooding",
  },
  {
    value: "heavilyDamaged",
    label: "Heavy Crash History",
    description: "This vehicle has been in a major accident",
  },
];

// Image constraints
export const MIN_IMAGES = 5;
export const MAX_IMAGES = 12;

// Description constraints
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 200;
