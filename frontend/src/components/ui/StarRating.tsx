"use client";

import { useMemo } from "react";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

interface StarRatingProps {
  value: number | undefined;
  max?: number;
  onChange: (value: number) => void;
  labels?: string[]; // optional labels for each star
  disabled?: boolean;
}

export default function StarRating({
  value,
  max = 5,
  onChange,
  labels,
  disabled = false,
}: StarRatingProps) {
  const stars = useMemo(
    () => Array.from({ length: max }, (_, i) => i + 1),
    [max]
  );

  return (
    <div className="flex items-center gap-2">
      {stars.map((star) => {
        const active = (value || 0) >= star;
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`transition-transform ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:scale-105"
            }`}
            title={labels?.[star - 1]}
          >
            {active ? (
              <StarSolid className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarOutline className="w-8 h-8 text-gray-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}
