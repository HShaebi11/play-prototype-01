"use client";

import { useMemo } from "react";
import { useVariableStore } from "@/hooks/useVariableStore";

type VariableSelectProps = {
  value?: string;
  onChange: (variableId: string | undefined) => void;
  label?: string;
  labelWidth?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export function VariableSelect({
  value,
  onChange,
  label,
  labelWidth = "w-24",
  allowEmpty = true,
  emptyLabel = "-- none --",
}: VariableSelectProps) {
  const variablesRecord = useVariableStore((state) => state.variables);
  const variables = useMemo(
    () => Object.values(variablesRecord),
    [variablesRecord],
  );

  return (
    <label className="flex items-center gap-1 text-[9px] text-white/60">
      {label ? (
        <span className={`${labelWidth} shrink-0`}>{label}</span>
      ) : null}
      <select
        className="min-w-0 flex-1 rounded border bg-black/40 px-1 py-0.5 font-mono text-[9px] text-white outline-none"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value.trim();
          onChange(next || undefined);
        }}
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {variables.map((variable) => (
          <option key={variable.id} value={variable.id}>
            {variable.id} — {variable.description || variable.label}
          </option>
        ))}
      </select>
    </label>
  );
}
