"use client";

import { useMemo, useState } from "react";
import {
  type ControllerControlType,
  useControllerConfigStore,
} from "@/lib/controllerConfig";
import { useVariableStore } from "@/hooks/useVariableStore";
import { ControllerLayoutEditor } from "@/components/panel/ControllerLayoutEditor";
import { VariableSelect } from "@/components/panel/VariableSelect";
import { ACCENT } from "@/lib/constants";

const CONTROL_TYPES: Array<{ type: ControllerControlType; label: string }> = [
  { type: "dial", label: "Dial" },
  { type: "slider", label: "Slider" },
  { type: "xy", label: "XY pad" },
  { type: "mode", label: "Mode" },
];

export function ControllerTab() {
  const config = useControllerConfigStore((state) => state.config);
  const addTab = useControllerConfigStore((state) => state.addTab);
  const updateTab = useControllerConfigStore((state) => state.updateTab);
  const removeTab = useControllerConfigStore((state) => state.removeTab);
  const addControl = useControllerConfigStore((state) => state.addControl);
  const updateControl = useControllerConfigStore((state) => state.updateControl);
  const updateControlLayout = useControllerConfigStore(
    (state) => state.updateControlLayout,
  );
  const removeControl = useControllerConfigStore((state) => state.removeControl);
  const reset = useControllerConfigStore((state) => state.reset);

  const variablesRecord = useVariableStore((state) => state.variables);

  const [activeTabId, setActiveTabId] = useState(config.tabs[0]?.id ?? "");
  const [selectedControlId, setSelectedControlId] = useState<string | null>(
    null,
  );

  const activeTab = useMemo(
    () => config.tabs.find((tab) => tab.id === activeTabId) ?? config.tabs[0],
    [config.tabs, activeTabId],
  );

  const selectedControl = activeTab?.controls.find(
    (c) => c.id === selectedControlId,
  );

  const previewValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const tab of config.tabs) {
      for (const control of tab.controls) {
        if (control.type === "dial" || control.type === "slider") {
          const varId = control.targetVariableId;
          values[control.id] = varId
            ? (variablesRecord[varId]?.value ?? 0.5)
            : 0.5;
        }
      }
    }
    return values;
  }, [config.tabs, variablesRecord]);

  if (!activeTab) {
    return null;
  }

  return (
    <div className="flex h-full">
      <aside
        className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r p-4"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] tracking-wider text-white/50">TABS</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[8px] hover:underline"
              style={{ color: ACCENT }}
              onClick={() => {
                addTab();
                const next = useControllerConfigStore.getState().config.tabs.at(-1);
                if (next) {
                  setActiveTabId(next.id);
                }
              }}
            >
              + Tab
            </button>
            <button
              type="button"
              className="text-[8px] text-white/40 hover:underline"
              onClick={() => reset()}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {config.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="rounded border px-2 py-1 text-[9px] tracking-wider"
              style={{
                borderColor:
                  tab.id === activeTab.id ? ACCENT : "rgba(255,255,255,0.15)",
                color:
                  tab.id === activeTab.id ? ACCENT : "rgba(255,255,255,0.5)",
              }}
              onClick={() => {
                setActiveTabId(tab.id);
                setSelectedControlId(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          className="rounded border bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={activeTab.label}
          onChange={(event) =>
            updateTab(activeTab.id, { label: event.target.value.toUpperCase() })
          }
        />

        {config.tabs.length > 1 ? (
          <button
            type="button"
            className="text-left text-[9px] text-red-400 hover:underline"
            onClick={() => {
              removeTab(activeTab.id);
              const remaining = useControllerConfigStore.getState().config.tabs[0];
              if (remaining) {
                setActiveTabId(remaining.id);
              }
              setSelectedControlId(null);
            }}
          >
            Delete tab
          </button>
        ) : null}

        <div>
          <span className="mb-2 block text-[9px] tracking-wider text-white/50">
            ADD CONTROL
          </span>
          <div className="flex flex-wrap gap-1">
            {CONTROL_TYPES.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                className="rounded border px-2 py-1 text-[8px] tracking-wider text-white/70 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                onClick={() => addControl(activeTab.id, type)}
              >
                + {label}
              </button>
            ))}
          </div>
        </div>

        {selectedControl ? (
          <div
            className="flex flex-col gap-2 rounded border p-2"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <span className="text-[9px] uppercase tracking-wider text-white/40">
              Selected: {selectedControl.type}
            </span>

            <label className="grid grid-cols-[56px_1fr] items-center gap-1 text-[9px] text-white/50">
              ID
              <input
                className="rounded border bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white outline-none"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                value={selectedControl.id}
                onChange={(event) =>
                  updateControl(activeTab.id, selectedControl.id, {
                    id: event.target.value.trim(),
                  })
                }
              />
            </label>

            <label className="grid grid-cols-[56px_1fr] items-center gap-1 text-[9px] text-white/50">
              Label
              <input
                className="rounded border bg-black/40 px-1.5 py-0.5 text-[9px] text-white outline-none"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                value={selectedControl.label}
                onChange={(event) =>
                  updateControl(activeTab.id, selectedControl.id, {
                    label: event.target.value,
                  })
                }
              />
            </label>

            <label className="grid grid-cols-[56px_1fr] items-center gap-1 text-[9px] text-white/50">
              About
              <input
                className="rounded border bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80 outline-none"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                value={selectedControl.description}
                placeholder="What this controls"
                onChange={(event) =>
                  updateControl(activeTab.id, selectedControl.id, {
                    description: event.target.value,
                  })
                }
              />
            </label>

            {selectedControl.type === "dial" ||
            selectedControl.type === "slider" ? (
              <VariableSelect
                label="Variable"
                labelWidth="w-14"
                allowEmpty
                value={selectedControl.targetVariableId}
                onChange={(variableId) =>
                  updateControl(activeTab.id, selectedControl.id, {
                    targetVariableId: variableId,
                  })
                }
              />
            ) : null}

            {selectedControl.type === "xy" ? (
              <>
                <VariableSelect
                  label="X var"
                  labelWidth="w-14"
                  allowEmpty
                  value={selectedControl.targetVariableXId}
                  onChange={(variableId) =>
                    updateControl(activeTab.id, selectedControl.id, {
                      targetVariableXId: variableId,
                    })
                  }
                />
                <VariableSelect
                  label="Y var"
                  labelWidth="w-14"
                  allowEmpty
                  value={selectedControl.targetVariableYId}
                  onChange={(variableId) =>
                    updateControl(activeTab.id, selectedControl.id, {
                      targetVariableYId: variableId,
                    })
                  }
                />
              </>
            ) : null}

            <button
              type="button"
              className="text-left text-[9px] text-red-400 hover:underline"
              onClick={() => {
                removeControl(activeTab.id, selectedControl.id);
                setSelectedControlId(null);
              }}
            >
              Remove control
            </button>
          </div>
        ) : (
          <p className="text-[9px] text-white/30">
            Click a control on the canvas to edit its properties. Create
            variables in the VARIABLES tab first, then assign them here.
          </p>
        )}
      </aside>

      <ControllerLayoutEditor
        controls={activeTab.controls}
        values={previewValues}
        activeMode="geo"
        selectedControlId={selectedControlId}
        onSelectControl={setSelectedControlId}
        onLayoutChange={(controlId, layout) =>
          updateControlLayout(activeTab.id, controlId, layout)
        }
      />
    </div>
  );
}
