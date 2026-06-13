"use client";

import { useCallback, useRef, useState } from "react";
import { ACCENT } from "@/lib/constants";

type SliderProps = {
  id: string;
  label: string;
  value: number;
  onChange: (id: string, value: number) => void;
};

const VALUE_CLAMP_MIN = 0;
const VALUE_CLAMP_MAX = 1;

function clamp01(value: number): number {
  return Math.min(VALUE_CLAMP_MAX, Math.max(VALUE_CLAMP_MIN, value));
}

export function Slider({ id, label, value, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const valueRef = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  valueRef.current = displayValue;

  const updateValue = useCallback(
    (next: number) => {
      const clamped = clamp01(next);
      setDisplayValue(clamped);
      onChange(id, clamped);
    },
    [id, onChange],
  );

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) {
        return;
      }

      const rect = trackRef.current.getBoundingClientRect();
      const next = (clientX - rect.left) / rect.width;
      updateValue(next);
    },
    [updateValue],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }
      updateFromPointer(event.clientX);
    },
    [updateFromPointer],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      draggingRef.current = true;
      updateFromPointer(event.clientX);

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, updateFromPointer],
  );

  return (
    <div className="flex w-full flex-col gap-2 px-6">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-white/70">
        <span>{label}</span>
        <span className="text-white">{displayValue.toFixed(2)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-8 touch-none select-none"
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label={label}
        aria-valuemin={VALUE_CLAMP_MIN}
        aria-valuemax={VALUE_CLAMP_MAX}
        aria-valuenow={displayValue}
        tabIndex={0}
      >
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${displayValue * 100}%`,
            backgroundColor: ACCENT,
          }}
        />
      </div>
    </div>
  );
}
