"use client";

import { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";

interface DualRangeSliderProps {
  min: number;
  max: number;
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  step?: number;
  formatValue?: (value: number) => string;
}

export default function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  step = 1,
  formatValue = (v) => v.toLocaleString(),
}: DualRangeSliderProps) {
  const currentMin = minValue ?? min;
  const currentMax = maxValue ?? max;
  const [values, setValues] = useState([currentMin, currentMax]);

  useEffect(() => {
    setValues([currentMin, currentMax]);
  }, [currentMin, currentMax]);

  const handleValueChange = (newValues: number[]) => {
    setValues(newValues);
    const newMin = newValues[0];
    const newMax = newValues[1];
    // Always pass the actual values - don't convert to undefined just because they equal min/max
    // The parent component can decide if it wants to filter on these values
    onMinChange(newMin);
    onMaxChange(newMax);
  };

  return (
    <div className="relative">
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={values}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
          <Slider.Range className="absolute bg-maroon rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-5 h-5 bg-maroon border-2 border-white rounded-full shadow-md hover:bg-red focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 cursor-pointer" />
        <Slider.Thumb className="block w-5 h-5 bg-maroon border-2 border-white rounded-full shadow-md hover:bg-red focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 cursor-pointer" />
      </Slider.Root>
      <div className="flex justify-between mt-3 text--1 text-gray-600">
        <span>{formatValue(values[0])}</span>
        <span>{formatValue(values[1])}</span>
      </div>
    </div>
  );
}
