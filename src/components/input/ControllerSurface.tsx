"use client";

import { useState } from "react";
import {
  CONTROLLER_DIALS_TOP_PX,
  DIAL_DEFAULT_DENSITY,
  DIAL_DEFAULT_SIZE,
  DIAL_DEFAULT_SPEED,
} from "@/lib/constants";
import { Dial } from "@/components/input/Dial";
import { ModeSwitcher, type PlayMode } from "@/components/input/ModeSwitcher";
import { XYPad } from "@/components/input/XYPad";

type ControllerSurfaceProps = {
  onDialChange: (id: string, value: number) => void;
  onXYChange: (x: number, y: number) => void;
  onModeChange: (mode: PlayMode) => void;
};

const DIALS = [
  { id: "speed", label: "speed", defaultValue: DIAL_DEFAULT_SPEED },
  { id: "size", label: "size", defaultValue: DIAL_DEFAULT_SIZE },
  { id: "density", label: "density", defaultValue: DIAL_DEFAULT_DENSITY },
] as const;

export function ControllerSurface({
  onDialChange,
  onXYChange,
  onModeChange,
}: ControllerSurfaceProps) {
  const [dialValues, setDialValues] = useState<Record<string, number>>({
    speed: DIAL_DEFAULT_SPEED,
    size: DIAL_DEFAULT_SIZE,
    density: DIAL_DEFAULT_DENSITY,
  });
  const [activeMode, setActiveMode] = useState<PlayMode>("geo");

  const handleDialChange = (id: string, value: number) => {
    setDialValues((prev) => ({ ...prev, [id]: value }));
    onDialChange(id, value);
  };

  const handleModeChange = (mode: PlayMode) => {
    setActiveMode(mode);
    onModeChange(mode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className="flex items-start justify-center gap-8 px-6"
        style={{ paddingTop: CONTROLLER_DIALS_TOP_PX }}
      >
        {DIALS.map(({ id, label, defaultValue }) => (
          <Dial
            key={id}
            id={id}
            label={label}
            value={dialValues[id] ?? defaultValue}
            onChange={handleDialChange}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-1 flex-col justify-between">
        <XYPad onChange={onXYChange} />
        <ModeSwitcher activeMode={activeMode} onChange={handleModeChange} />
      </div>
    </div>
  );
}
