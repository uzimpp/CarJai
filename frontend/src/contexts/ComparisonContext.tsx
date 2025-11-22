"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { CarListing } from "@/types/car";

interface ComparisonContextType {
  comparedCars: CarListing[];
  addToComparison: (car: CarListing) => boolean;
  removeFromComparison: (carId: number) => void;
  clearComparison: () => void;
  isInComparison: (carId: number) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

const MAX_COMPARISON_ITEMS = 4;
const STORAGE_KEY = "carjai_comparison";

export function ComparisonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [comparedCars, setComparedCars] = useState<CarListing[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CarListing[];
          setComparedCars(parsed.slice(0, MAX_COMPARISON_ITEMS));
        }
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage whenever comparison changes
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comparedCars));
      } catch {
        // Ignore storage errors
      }
    }
  }, [comparedCars, mounted]);

  const addToComparison = useCallback((car: CarListing): boolean => {
    setComparedCars((prev) => {
      // Check if already in comparison
      if (prev.some((c) => c.id === car.id)) {
        return prev;
      }
      // Check if at max capacity
      if (prev.length >= MAX_COMPARISON_ITEMS) {
        return prev;
      }
      return [...prev, car];
    });
    return true;
  }, []);

  const removeFromComparison = useCallback((carId: number) => {
    setComparedCars((prev) => prev.filter((car) => car.id !== carId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparedCars([]);
  }, []);

  const isInComparison = useCallback(
    (carId: number) => {
      return comparedCars.some((car) => car.id === carId);
    },
    [comparedCars]
  );

  const canAddMore = comparedCars.length < MAX_COMPARISON_ITEMS;

  return (
    <ComparisonContext.Provider
      value={{
        comparedCars,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
