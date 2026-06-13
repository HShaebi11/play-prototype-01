"use client";

import { useState } from "react";
import {
  ACCENT,
  BG_COLOR,
  PANEL_BG_COLOR,
  PANEL_BORDER_COLOR,
} from "@/lib/constants";
import { ControllerTab } from "@/components/panel/ControllerTab";
import { InputsTab } from "@/components/panel/InputsTab";
import { LayersTab } from "@/components/panel/LayersTab";
import { VariablesTab } from "@/components/panel/VariablesTab";

export type PanelTab = "layers" | "variables" | "inputs" | "controller";

type ControlPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: "layers", label: "LAYERS" },
  { id: "variables", label: "VARIABLES" },
  { id: "controller", label: "CONTROLLER" },
  { id: "inputs", label: "INPUTS" },
];

export function ControlPanel({ open, onOpenChange }: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("layers");

  return (
    <>
      <button
        type="button"
        className="pointer-events-auto fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xs font-semibold tracking-wider transition-opacity hover:opacity-90"
        style={{
          backgroundColor: ACCENT,
          color: BG_COLOR,
        }}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={open ? "Close control panel" : "Open control panel"}
      >
        {open ? "✕" : "☰"}
        <span>PANEL</span>
      </button>

      {open ? (
        <div
          className="pointer-events-auto fixed inset-0 z-40 flex flex-col font-mono text-xs text-white"
          style={{ backgroundColor: PANEL_BG_COLOR }}
        >
          <div
            className="flex shrink-0 items-center justify-between border-b px-4 py-3"
            style={{ borderColor: PANEL_BORDER_COLOR }}
          >
            <div className="flex">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="px-4 py-2 text-[11px] tracking-wider transition-colors"
                    style={{
                      color: isActive ? ACCENT : "rgba(255,255,255,0.4)",
                      borderBottom: isActive
                        ? `2px solid ${ACCENT}`
                        : "2px solid transparent",
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="text-[11px] tracking-wider text-white/50 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              CLOSE
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "layers" && (
              <div className="h-full overflow-y-auto p-4">
                <LayersTab />
              </div>
            )}
            {activeTab === "variables" && (
              <div className="h-full overflow-y-auto p-4">
                <VariablesTab />
              </div>
            )}
            {activeTab === "controller" && (
              <div className="h-full overflow-hidden">
                <ControllerTab />
              </div>
            )}
            {activeTab === "inputs" && (
              <div className="h-full overflow-y-auto p-4">
                <InputsTab />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
