"use client";

import { useMemo, useState } from "react";
import {
  type ControllerControl,
  type ControllerControlType,
  useControllerConfigStore,
} from "@/lib/controllerConfig";
import { useVariableStore } from "@/hooks/useVariableStore";
import { ACCENT } from "@/lib/constants";

const CONTROL_TYPES: Array<{ type: ControllerControlType; label: string }> = [
  { type: "dial", label: "Dial" },
  { type: "slider", label: "Slider" },
  { type: "xy", label: "XY pad" },
  { type: "mode", label: "Mode" },
];

function ControlEditorRow({
  control,
  variableIds,
  onUpdate,
  onRemove,
}: {
  control: ControllerControl;
  variableIds: string[];
  onUpdate: (patch: Partial<ControllerControl>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="rounded border p-2"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase tracking-wider text-white/40">
          {control.type}
        </span>
        <button
          type="button"
          className="text-[9px] text-red-400 hover:underline"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="mb-2 grid grid-cols-[72px_1fr] items-center gap-x-2 gap-y-1.5">
        <label className="text-[9px] text-white/50">ID</label>
        <input
          className="rounded border bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={control.id}
          onChange={(event) => onUpdate({ id: event.target.value.trim() })}
        />

        <label className="text-[9px] text-white/50">Label</label>
        <input
          className="rounded border bg-black/40 px-1.5 py-0.5 text-[9px] text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={control.label}
          onChange={(event) => onUpdate({ label: event.target.value })}
        />

        <label className="text-[9px] text-white/50">Description</label>
        <input
          className="rounded border bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80 outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={control.description}
          placeholder="What this control affects"
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </div>

      {control.type === "dial" || control.type === "slider" ? (
        <div className="grid grid-cols-[72px_1fr] items-center gap-x-2 gap-y-1.5">
          <label className="text-[9px] text-white/50">Variable</label>
          <select
            className="rounded border bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            value={control.targetVariableId ?? ""}
            onChange={(event) =>
              onUpdate({ targetVariableId: event.target.value || control.id })
            }
          >
            <option value={control.id}>{control.id} (same as control)</option>
            {variableIds
              .filter((id) => id !== control.id)
              .map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
          </select>
        </div>
      ) : null}

      {control.type === "xy" ? (
        <div className="grid grid-cols-[72px_1fr] items-center gap-x-2 gap-y-1.5">
          <label className="text-[9px] text-white/50">X variable</label>
          <select
            className="rounded border bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            value={control.targetVariableXId ?? ""}
            onChange={(event) =>
              onUpdate({ targetVariableXId: event.target.value })
            }
          >
            {variableIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <label className="text-[9px] text-white/50">Y variable</label>
          <select
            className="rounded border bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            value={control.targetVariableYId ?? ""}
            onChange={(event) =>
              onUpdate({ targetVariableYId: event.target.value })
            }
          >
            {variableIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

export function ControllerTab() {
  const config = useControllerConfigStore((state) => state.config);
  const addTab = useControllerConfigStore((state) => state.addTab);
  const updateTab = useControllerConfigStore((state) => state.updateTab);
  const removeTab = useControllerConfigStore((state) => state.removeTab);
  const addControl = useControllerConfigStore((state) => state.addControl);
  const updateControl = useControllerConfigStore((state) => state.updateControl);
  const removeControl = useControllerConfigStore((state) => state.removeControl);
  const reset = useControllerConfigStore((state) => state.reset);

  const variablesRecord = useVariableStore((state) => state.variables);
  const variableIds = useMemo(
    () => Object.values(variablesRecord).map((variable) => variable.id),
    [variablesRecord],
  );

  const [activeTabId, setActiveTabId] = useState(config.tabs[0]?.id ?? "");

  const activeTab = useMemo(
    () => config.tabs.find((tab) => tab.id === activeTabId) ?? config.tabs[0],
    [config.tabs, activeTabId],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-wider text-white/50">
          PHONE TABS
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[8px] hover:underline"
            style={{ color: ACCENT }}
            onClick={() => {
              addTab();
              const nextTab = useControllerConfigStore.getState().config.tabs.at(-1);
              if (nextTab) {
                setActiveTabId(nextTab.id);
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
        {config.tabs.map((tab) => {
          const isActive = tab.id === activeTab?.id;
          return (
            <button
              key={tab.id}
              type="button"
              className="rounded border px-2 py-1 text-[9px] tracking-wider"
              style={{
                borderColor: isActive ? ACCENT : "rgba(255,255,255,0.15)",
                color: isActive ? ACCENT : "rgba(255,255,255,0.5)",
              }}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab ? (
        <>
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded border bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white outline-none"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
              value={activeTab.label}
              onChange={(event) =>
                updateTab(activeTab.id, { label: event.target.value.toUpperCase() })
              }
            />
            {config.tabs.length > 1 ? (
              <button
                type="button"
                className="text-[9px] text-red-400 hover:underline"
                onClick={() => {
                  removeTab(activeTab.id);
                  const remaining = useControllerConfigStore
                    .getState()
                    .config.tabs[0];
                  if (remaining) {
                    setActiveTabId(remaining.id);
                  }
                }}
              >
                Delete tab
              </button>
            ) : null}
          </div>

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

          <div className="flex flex-col gap-2">
            {activeTab.controls.length === 0 ? (
              <p className="text-[9px] text-white/30">
                No controls on this tab yet. Add a dial, slider, or XY pad.
              </p>
            ) : (
              activeTab.controls.map((control) => (
                <ControlEditorRow
                  key={control.id}
                  control={control}
                  variableIds={variableIds}
                  onUpdate={(patch) =>
                    updateControl(activeTab.id, control.id, patch)
                  }
                  onRemove={() => removeControl(activeTab.id, control.id)}
                />
              ))
            )}
          </div>
        </>
      ) : null}

      <p className="text-[8px] text-white/30">
        Changes sync to the connected phone automatically. Each control ID is sent
        over the network; the description is shown here on desktop only.
      </p>
    </div>
  );
}
