"use client";

import { useCallback, useRef, useState } from "react";
import {
  ACCENT,
  DIAL_ANGLE_MIN_DEG,
  DIAL_ARC_DEG,
  DIAL_ARC_RAD,
  DIAL_SIZE_PX,
} from "@/lib/constants";

type DialProps = {
  id: string;
  label: string;
  value: number;
  onChange: (id: string, value: number) => void;
};

const DIAL_RADIUS = DIAL_SIZE_PX / 2;
const INDICATOR_LENGTH = DIAL_RADIUS - 6;
const VALUE_CLAMP_MIN = 0;
const VALUE_CLAMP_MAX = 1;

function clamp01(value: number): number {
  return Math.min(VALUE_CLAMP_MAX, Math.max(VALUE_CLAMP_MIN, value));
}

function valueToRotationDeg(value: number): number {
  return DIAL_ANGLE_MIN_DEG + value * DIAL_ARC_DEG;
}

function pointerAngleRad(
  clientX: number,
  clientY: number,
  centerX: number,
  centerY: number,
): number {
  return Math.atan2(clientY - centerY, clientX - centerX);
}

function normalizeAngleDelta(delta: number): number {
  if (delta > Math.PI) {
    return delta - 2 * Math.PI;
  }
  if (delta < -Math.PI) {
    return delta + 2 * Math.PI;
  }
  return delta;
}

export function Dial({ id, label, value, onChange }: DialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastAngleRef = useRef(0);
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

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current || !dialRef.current) {
        return;
      }

      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = pointerAngleRad(event.clientX, event.clientY, centerX, centerY);
      const delta = normalizeAngleDelta(angle - lastAngleRef.current);
      lastAngleRef.current = angle;

      updateValue(valueRef.current + delta / DIAL_ARC_RAD);
    },
    [updateValue],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointercancel", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dialRef.current) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      lastAngleRef.current = pointerAngleRad(
        event.clientX,
        event.clientY,
        centerX,
        centerY,
      );
      draggingRef.current = true;

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  const rotation = valueToRotationDeg(displayValue);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={dialRef}
        className="touch-none select-none"
        style={{ width: DIAL_SIZE_PX, height: DIAL_SIZE_PX }}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label={label}
        aria-valuemin={VALUE_CLAMP_MIN}
        aria-valuemax={VALUE_CLAMP_MAX}
        aria-valuenow={displayValue}
        tabIndex={0}
      >
        <svg
          width={DIAL_SIZE_PX}
          height={DIAL_SIZE_PX}
          viewBox={`0 0 ${DIAL_SIZE_PX} ${DIAL_SIZE_PX}`}
          className="block"
        >
          <circle
            cx={DIAL_RADIUS}
            cy={DIAL_RADIUS}
            r={DIAL_RADIUS - 2}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={1}
          />
          <line
            x1={DIAL_RADIUS}
            y1={DIAL_RADIUS}
            x2={DIAL_RADIUS}
            y2={DIAL_RADIUS - INDICATOR_LENGTH}
            stroke={ACCENT}
            strokeWidth={2}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${DIAL_RADIUS} ${DIAL_RADIUS})`}
          />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-white/70">
        <span>{label}</span>
        <span className="text-white">{displayValue.toFixed(2)}</span>
      </div>
    </div>
  );
}
