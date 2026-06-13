"use client";

import { useEffect, useMemo, useState } from "react";
import type { ControllerConfig } from "@/lib/controllerConfig";
import { DEFAULT_CONTROLLER_CONFIG } from "@/lib/controllerConfig";
import { ControllerLayoutRenderer } from "@/components/controller/ControllerLayoutRenderer";
import type { PlayMode } from "@/components/input/ModeSwitcher";
import { ACCENT } from "@/lib/constants";

type ControllerSurfaceProps = {
  config: ControllerConfig;
  variableDefaults?: Record<string, number>;
  onDialChange: (id: string, value: number) => void;
  onSliderChange: (id: string, value: number) => void;
  onXYChange: (id: string, x: number, y: number) => void;
  onModeChange: (mode: PlayMode) => void;
};

function buildInitialValues(
  config: ControllerConfig,
  variableDefaults: Record<string, number>,
): Record<string, number> {
  const values: Record<string, number> = {};

  for (const tab of config.tabs) {
    for (const control of tab.controls) {
      if (control.type === "dial" || control.type === "slider") {
        const varId = control.targetVariableId;
        values[control.id] = varId
          ? (variableDefaults[varId] ?? 0.5)
          : 0.5;
      }
    }
  }

  return values;
}

export function ControllerSurface({
  config,
  variableDefaults = {},
  onDialChange,
  onSliderChange,
  onXYChange,
  onModeChange,
}: ControllerSurfaceProps) {
  const tabs =
    config.tabs.length > 0 ? config.tabs : DEFAULT_CONTROLLER_CONFIG.tabs;
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const [values, setValues] = useState(() =>
    buildInitialValues(config, variableDefaults),
  );
  const [activeMode, setActiveMode] = useState<PlayMode>("geo");

  useEffect(() => {
    setValues(buildInitialValues(config, variableDefaults));
    setActiveTabId((current) =>
      tabs.some((tab) => tab.id === current) ? current : (tabs[0]?.id ?? ""),
    );
  }, [config, tabs, variableDefaults]);

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
      <div className="flex h-[100dvh] w-[100vw] items-center justify-center text-sm text-white/40">
        No controller tabs configured
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-[100vw] flex-col overflow-hidden">
      <div className="controller-portrait-hint pointer-events-none fixed inset-x-0 top-0 z-50 bg-amber-500/90 py-2 text-center text-[10px] font-mono tracking-wider text-black">
        Rotate to landscape for best experience
      </div>

      <div className="relative min-h-0 flex-1">
        <ControllerLayoutRenderer
          controls={activeTab.controls}
          values={values}
          activeMode={activeMode}
          onDialChange={handleDialChange}
          onSliderChange={handleSliderChange}
          onXYChange={onXYChange}
          onModeChange={handleModeChange}
        />
      </div>

      {tabs.length > 1 ? (
        <div className="flex shrink-0 justify-center gap-2 border-t border-white/10 px-4 py-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="px-4 py-2 text-[10px] tracking-wider transition-colors"
                style={{
                  color: isActive ? ACCENT : "rgba(255,255,255,0.4)",
                  borderBottom: isActive
                    ? `2px solid ${ACCENT}`
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
