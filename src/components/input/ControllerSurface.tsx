"use client";

import { useEffect, useMemo, useState } from "react";
import type { ControllerConfig, ControllerControl } from "@/lib/controllerConfig";
import { DEFAULT_CONTROLLER_CONFIG } from "@/lib/controllerConfig";
import { Dial } from "@/components/input/Dial";
import { ModeSwitcher, type PlayMode } from "@/components/input/ModeSwitcher";
import { Slider } from "@/components/input/Slider";
import { XYPad } from "@/components/input/XYPad";
import { CONTROLLER_DIALS_TOP_PX } from "@/lib/constants";

type ControllerSurfaceProps = {
  config: ControllerConfig;
  onDialChange: (id: string, value: number) => void;
  onSliderChange: (id: string, value: number) => void;
  onXYChange: (id: string, x: number, y: number) => void;
  onModeChange: (mode: PlayMode) => void;
};

function buildInitialValues(config: ControllerConfig): Record<string, number> {
  const values: Record<string, number> = {};

  for (const tab of config.tabs) {
    for (const control of tab.controls) {
      if (control.type === "dial" || control.type === "slider") {
        values[control.id] = control.defaultValue ?? 0.5;
      }
    }
  }

  return values;
}

function renderDialRow(
  controls: ControllerControl[],
  values: Record<string, number>,
  onDialChange: (id: string, value: number) => void,
) {
  const dials = controls.filter((control) => control.type === "dial");
  if (dials.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-start justify-center gap-8 px-6"
      style={{ paddingTop: CONTROLLER_DIALS_TOP_PX }}
    >
      {dials.map((control) => (
        <Dial
          key={control.id}
          id={control.id}
          label={control.label}
          value={values[control.id] ?? control.defaultValue ?? 0.5}
          onChange={onDialChange}
        />
      ))}
    </div>
  );
}

function renderOtherControls(
  controls: ControllerControl[],
  values: Record<string, number>,
  handlers: {
    onSliderChange: (id: string, value: number) => void;
    onXYChange: (id: string, x: number, y: number) => void;
    onModeChange: (mode: PlayMode) => void;
  },
  activeMode: PlayMode,
) {
  const sliders = controls.filter((control) => control.type === "slider");
  const xyPads = controls.filter((control) => control.type === "xy");
  const hasMode = controls.some((control) => control.type === "mode");

  return (
    <div className="mt-8 flex flex-1 flex-col justify-between gap-8 pb-6">
      {sliders.length > 0 ? (
        <div className="flex flex-col gap-6">
          {sliders.map((control) => (
            <Slider
              key={control.id}
              id={control.id}
              label={control.label}
              value={values[control.id] ?? control.defaultValue ?? 0.5}
              onChange={handlers.onSliderChange}
            />
          ))}
        </div>
      ) : null}

      {xyPads.map((control) => (
        <XYPad
          key={control.id}
          label={control.label}
          xLabel={control.targetVariableXId}
          yLabel={control.targetVariableYId}
          defaultX={control.defaultX}
          defaultY={control.defaultY}
          onChange={(x, y) => handlers.onXYChange(control.id, x, y)}
        />
      ))}

      {hasMode ? (
        <ModeSwitcher activeMode={activeMode} onChange={handlers.onModeChange} />
      ) : null}
    </div>
  );
}

export function ControllerSurface({
  config,
  onDialChange,
  onSliderChange,
  onXYChange,
  onModeChange,
}: ControllerSurfaceProps) {
  const tabs = config.tabs.length > 0 ? config.tabs : DEFAULT_CONTROLLER_CONFIG.tabs;
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const [values, setValues] = useState(() => buildInitialValues(config));
  const [activeMode, setActiveMode] = useState<PlayMode>("geo");

  useEffect(() => {
    setValues(buildInitialValues(config));
    setActiveTabId((current) =>
      tabs.some((tab) => tab.id === current) ? current : (tabs[0]?.id ?? ""),
    );
  }, [config, tabs]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );

  const handleDialChange = (id: string, value: number) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    onDialChange(id, value);
  };

  const handleSliderChange = (id: string, value: number) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    onSliderChange(id, value);
  };

  const handleModeChange = (mode: PlayMode) => {
    setActiveMode(mode);
    onModeChange(mode);
  };

  if (!activeTab) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-white/40">
        No controller tabs configured
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {renderDialRow(activeTab.controls, values, handleDialChange)}
      {renderOtherControls(
        activeTab.controls,
        values,
        {
          onSliderChange: handleSliderChange,
          onXYChange,
          onModeChange: handleModeChange,
        },
        activeMode,
      )}

      {tabs.length > 1 ? (
        <div className="mt-auto flex justify-center gap-2 border-t border-white/10 px-4 py-4">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="px-4 py-2 text-[10px] tracking-wider transition-colors"
                style={{
                  color: isActive ? "#f59e0b" : "rgba(255,255,255,0.4)",
                  borderBottom: isActive
                    ? "2px solid #f59e0b"
                    : "2px solid transparent",
                }}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
