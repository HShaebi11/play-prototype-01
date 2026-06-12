"use client";

import { useCallback, useRef, useState } from "react";
import {
  ACCENT,
  XY_PAD_DEFAULT,
  XY_PAD_DOT_PX,
  XY_PAD_INSET_PX,
} from "@/lib/constants";

type XYPadProps = {
  onChange: (x: number, y: number) => void;
};

const VALUE_CLAMP_MIN = 0;
const VALUE_CLAMP_MAX = 1;

function clamp01(value: number): number {
  return Math.min(VALUE_CLAMP_MAX, Math.max(VALUE_CLAMP_MIN, value));
}

function positionToNormalised(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  const x = clamp01((clientX - rect.left) / rect.width);
  const y = clamp01((clientY - rect.top) / rect.height);
  return { x, y };
}

export function XYPad({ onChange }: XYPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState({ x: XY_PAD_DEFAULT, y: XY_PAD_DEFAULT });

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current) {
        return;
      }

      const rect = padRef.current.getBoundingClientRect();
      const { x, y } = positionToNormalised(clientX, clientY, rect);
      setPosition({ x, y });
      onChange(x, y);
    },
    [onChange],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current) {
        return;
      }
      updateFromPointer(event.clientX, event.clientY);
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
      updateFromPointer(event.clientX, event.clientY);

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp, updateFromPointer],
  );

  const dotOffset = XY_PAD_DOT_PX / 2;

  return (
    <div
      className="flex flex-col gap-2"
      style={{
        paddingLeft: XY_PAD_INSET_PX,
        paddingRight: XY_PAD_INSET_PX,
      }}
    >
      <div
        ref={padRef}
        className="relative aspect-square w-full touch-none select-none border border-white/10 bg-[#0a0a0a]"
        onPointerDown={handlePointerDown}
        role="group"
        aria-label="XY pad"
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: XY_PAD_DOT_PX,
            height: XY_PAD_DOT_PX,
            backgroundColor: ACCENT,
            left: `calc(${position.x * 100}% - ${dotOffset}px)`,
            top: `calc(${position.y * 100}% - ${dotOffset}px)`,
          }}
        />
      </div>
      <p className="text-[10px] text-white/50">x: xy_x  y: xy_y</p>
    </div>
  );
}
