"use client";

import { BG_COLOR, ACCENT } from "@/lib/constants";

export type PlayMode = "geo" | "audio" | "colour";

type ModeSwitcherProps = {
  activeMode: PlayMode;
  onChange: (mode: PlayMode) => void;
};

const MODES: { value: PlayMode; label: string }[] = [
  { value: "geo", label: "GEO" },
  { value: "audio", label: "AUDIO" },
  { value: "colour", label: "COLOUR" },
];

export function ModeSwitcher({ activeMode, onChange }: ModeSwitcherProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-8 pb-8">
      {MODES.map(({ value, label }) => {
        const isActive = activeMode === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="cursor-pointer border font-mono text-xs uppercase tracking-wide transition-colors"
            style={{
              borderRadius: 9999,
              padding: "8px 20px",
              backgroundColor: isActive ? ACCENT : "transparent",
              borderColor: isActive ? ACCENT : "#ffffff",
              color: isActive ? BG_COLOR : "#ffffff",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
