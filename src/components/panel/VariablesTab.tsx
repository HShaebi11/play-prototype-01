"use client";

import { useMemo, useState } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useVariableStore, useVariableStoreApi } from "@/hooks/useVariableStore";
import {
  evaluateExpression,
  useExpressionStore,
} from "@/lib/expressions";
import { ACCENT, BG_COLOR, PANEL_SELECTED_TINT } from "@/lib/constants";

export function VariablesTab() {
  const variablesRecord = useVariableStore((state) => state.variables);
  const addVariable = useVariableStore((state) => state.add);
  const updateVariable = useVariableStore((state) => state.update);
  const removeVariable = useVariableStore((state) => state.remove);
  const setVar = useVariableStore((state) => state.set);
  const variables = useMemo(
    () => Object.values(variablesRecord),
    [variablesRecord],
  );
  const setExpression = useExpressionStore((state) => state.setExpression);
  const getExpression = useExpressionStore((state) => state.getExpression);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formulaDraft, setFormulaDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [newId, setNewId] = useState("");
  const [newDefault, setNewDefault] = useState(0.5);

  useAnimationFrame(() => {
    const allVariables = useVariableStoreApi.getState().getAll();
    const getVar = useVariableStoreApi.getState().get;
    const setVar = useVariableStoreApi.getState().set;
    const nextErrors: Record<string, boolean> = {};

    for (const variable of allVariables) {
      const expression = getExpression(variable.id);
      const raw = getVar(variable.id);
      const result = evaluateExpression(expression, getVar, raw);
      nextErrors[variable.id] = result.error;

      if (!result.error && Math.abs(result.value - raw) > 0.0001) {
        setVar(variable.id, result.value, "internal");
      }
    }

    setErrors((current) => {
      const changed = allVariables.some(
        (variable) => current[variable.id] !== nextErrors[variable.id],
      );
      return changed ? nextErrors : current;
    });
  });

  const updateExpression = (variableId: string, expression: string) => {
    setExpression(variableId, expression);
    if (selectedId === variableId) {
      setFormulaDraft(expression);
    }
  };

  const handleAddVariable = () => {
    const id = newId.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id || variablesRecord[id]) {
      return;
    }

    addVariable({
      id,
      label: id,
      description: "Describe what this variable controls",
      defaultValue: newDefault,
    });
    setExpression(id, id);
    setNewId("");
    setNewDefault(0.5);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <p className="text-[10px] text-white/40">
        Create variables here first, then assign them to layers and phone
        controls.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[9px] text-white/50">
          ID
          <input
            className="w-40 rounded border bg-black/40 px-2 py-1 font-mono text-[10px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            placeholder="my_variable"
            value={newId}
            onChange={(event) => setNewId(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[9px] text-white/50">
          Default
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(newDefault * 100)}
            className="w-32 accent-amber-500"
            onChange={(event) =>
              setNewDefault(Number(event.target.value) / 100)
            }
          />
        </label>
        <button
          type="button"
          className="rounded px-3 py-1.5 text-[10px] tracking-wider"
          style={{ backgroundColor: ACCENT, color: BG_COLOR }}
          onClick={handleAddVariable}
        >
          + Add variable
        </button>
      </div>

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="text-left text-white/50">
            <th className="pb-2 pr-3 font-normal">ID</th>
            <th className="pb-2 pr-3 font-normal">Description</th>
            <th className="pb-2 pr-3 font-normal">Default</th>
            <th className="pb-2 font-normal">Expression</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => {
            const isSelected = selectedId === variable.id;
            const expression = getExpression(variable.id);
            const hasError = errors[variable.id];

            return (
              <tr
                key={variable.id}
                className="cursor-pointer border-t"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  backgroundColor: isSelected
                    ? PANEL_SELECTED_TINT
                    : "transparent",
                }}
                onClick={() => {
                  setSelectedId(variable.id);
                  setFormulaDraft(expression);
                }}
              >
                <td className="py-2 pr-3 align-top font-mono text-white/80">
                  {variable.id}
                </td>
                <td className="py-2 pr-3 align-top">
                  <input
                    className="w-full rounded border bg-transparent px-1 py-0.5 text-[9px] text-white/70 outline-none"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                    value={variable.description}
                    onChange={(event) =>
                      updateVariable(variable.id, {
                        description: event.target.value,
                      })
                    }
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>
                <td className="py-2 pr-3 align-top">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(variable.value * 100)}
                    className="w-24 accent-amber-500"
                    onChange={(event) => {
                      const value = Number(event.target.value) / 100;
                      setVar(variable.id, value, "internal");
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <span className="ml-1 font-mono text-white/50">
                    {variable.value.toFixed(2)}
                  </span>
                </td>
                <td className="py-2 align-top">
                  <div className="flex items-start gap-1">
                    <input
                      className="min-w-0 flex-1 rounded border bg-transparent px-1.5 py-0.5 font-mono outline-none"
                      style={{
                        borderColor: hasError
                          ? "#ef4444"
                          : "rgba(255,255,255,0.15)",
                        color: hasError ? "#ef4444" : "rgba(255,255,255,0.9)",
                      }}
                      value={expression}
                      onChange={(event) =>
                        updateExpression(variable.id, event.target.value)
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="shrink-0 text-[8px] text-red-400 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeVariable(variable.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div>
        <label className="mb-1 block text-[9px] tracking-wider text-white/40">
          FORMULA BAR
        </label>
        <input
          className="w-full rounded border px-2 py-1.5 font-mono text-[10px] outline-none"
          style={{
            backgroundColor: BG_COLOR,
            borderColor: "rgba(255,255,255,0.15)",
            color: selectedId ? "white" : "rgba(255,255,255,0.35)",
            caretColor: ACCENT,
          }}
          placeholder="Select a variable to edit"
          value={selectedId ? formulaDraft : ""}
          disabled={!selectedId}
          onChange={(event) => {
            if (!selectedId) {
              return;
            }
            setFormulaDraft(event.target.value);
            updateExpression(selectedId, event.target.value);
          }}
        />
      </div>
    </div>
  );
}
