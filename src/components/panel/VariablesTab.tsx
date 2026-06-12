"use client";

import { useState } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useVariableStore, useVariableStoreApi } from "@/hooks/useVariableStore";
import {
  evaluateExpression,
  useExpressionStore,
} from "@/lib/expressions";
import { ACCENT, BG_COLOR, PANEL_SELECTED_TINT } from "@/lib/constants";

export function VariablesTab() {
  const variables = useVariableStore((state) => state.getAll());
  const setExpression = useExpressionStore((state) => state.setExpression);
  const getExpression = useExpressionStore((state) => state.getExpression);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formulaDraft, setFormulaDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="text-left text-white/50">
            <th className="pb-2 pr-2 font-normal">Variable</th>
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
                className="cursor-pointer"
                style={{
                  backgroundColor: isSelected ? PANEL_SELECTED_TINT : "transparent",
                }}
                onClick={() => {
                  setSelectedId(variable.id);
                  setFormulaDraft(expression);
                }}
              >
                <td className="py-1 pr-2 font-mono text-white/80">{variable.id}</td>
                <td className="py-1">
                  <input
                    className="w-full rounded border bg-transparent px-1.5 py-0.5 font-mono outline-none"
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
