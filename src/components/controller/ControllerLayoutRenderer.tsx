"use client";

import type { CSSProperties } from "react";
import type { ControllerControl } from "@/lib/controllerConfig";
import { Dial } from "@/components/input/Dial";
import { ModeSwitcher, type PlayMode } from "@/components/input/ModeSwitcher";
import { Slider } from "@/components/input/Slider";
import { XYPad } from "@/components/input/XYPad";

export type ControllerLayoutRendererProps = {
  controls: ControllerControl[];
  values: Record<string, number>;
  activeMode: PlayMode;
  interactive?: boolean;
  selectedControlId?: string | null;
  onDialChange?: (id: string, value: number) => void;
  onSliderChange?: (id: string, value: number) => void;
  onXYChange?: (id: string, x: number, y: number) => void;
  onModeChange?: (mode: PlayMode) => void;
  onSelectControl?: (controlId: string) => void;
  className?: string;
};

function layoutStyle(layout: ControllerControl["layout"]): CSSProperties {
  return {
    position: "absolute",
    left: `${layout.x * 100}%`,
    top: `${layout.y * 100}%`,
    width: `${layout.w * 100}%`,
    height: `${layout.h * 100}%`,
  };
}

export function ControllerLayoutRenderer({
  controls,
  values,
  activeMode,
  interactive = true,
  selectedControlId,
  onDialChange,
  onSliderChange,
  onXYChange,
  onModeChange,
  onSelectControl,
  className,
}: ControllerLayoutRendererProps) {
  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      {controls.map((control) => {
        const isSelected = selectedControlId === control.id;
        const wrapperClass = interactive
          ? "pointer-events-auto flex h-full w-full items-center justify-center overflow-hidden"
          : "flex h-full w-full items-center justify-center overflow-hidden";

        const content = (() => {
          switch (control.type) {
            case "dial":
              return (
                <Dial
                  id={control.id}
                  label={control.label}
                  value={values[control.id] ?? 0.5}
                  onChange={(id, value) => onDialChange?.(id, value)}
                />
              );
            case "slider":
              return (
                <Slider
                  id={control.id}
                  label={control.label}
                  value={values[control.id] ?? 0.5}
                  onChange={(id, value) => onSliderChange?.(id, value)}
                />
              );
            case "xy":
              return (
                <XYPad
                  label={control.label}
                  xLabel={control.targetVariableXId}
                  yLabel={control.targetVariableYId}
                  onChange={(x, y) => onXYChange?.(control.id, x, y)}
                />
              );
            case "mode":
              return (
                <ModeSwitcher
                  activeMode={activeMode}
                  onChange={(mode) => onModeChange?.(mode)}
                />
              );
          }
        })();

        return (
          <div
            key={control.id}
            style={layoutStyle(control.layout)}
            className={wrapperClass}
            onClick={
              onSelectControl
                ? (event) => {
                    event.stopPropagation();
                    onSelectControl(control.id);
                  }
                : undefined
            }
          >
            {onSelectControl ? (
              <div
                className="relative h-full w-full rounded border transition-colors"
                style={{
                  borderColor: isSelected
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.08)",
                  backgroundColor: isSelected
                    ? "rgba(245,158,11,0.08)"
                    : "transparent",
                }}
              >
                <div className="flex h-full w-full items-center justify-center p-1">
                  {content}
                </div>
              </div>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
