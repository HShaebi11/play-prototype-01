"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GAMEPAD_AXIS_LEFT_TRIGGER,
  GAMEPAD_AXIS_RIGHT_TRIGGER,
  normalizeGamepadAxis,
  normalizeGamepadTrigger,
} from "@/lib/constants";
import { useVariableStore } from "@/hooks/useVariableStore";
import {
  sourceKey,
  useMappingStore,
  type InputSource,
} from "@/lib/mappings";
import { ACCENT } from "@/lib/constants";

type GamepadInputRow = {
  label: string;
  source: InputSource;
  kind: "axis" | "button";
  axisIndex?: number;
};

const GAMEPAD_ROWS: GamepadInputRow[] = [
  {
    label: "Left stick X",
    source: { device: "gamepad", type: "axis", index: 0 },
    kind: "axis",
    axisIndex: 0,
  },
  {
    label: "Left stick Y",
    source: { device: "gamepad", type: "axis", index: 1 },
    kind: "axis",
    axisIndex: 1,
  },
  {
    label: "Right stick X",
    source: { device: "gamepad", type: "axis", index: 2 },
    kind: "axis",
    axisIndex: 2,
  },
  {
    label: "Right stick Y",
    source: { device: "gamepad", type: "axis", index: 3 },
    kind: "axis",
    axisIndex: 3,
  },
  {
    label: "Left trigger",
    source: { device: "gamepad", type: "axis", index: 4 },
    kind: "axis",
    axisIndex: 4,
  },
  {
    label: "Right trigger",
    source: { device: "gamepad", type: "axis", index: 5 },
    kind: "axis",
    axisIndex: 5,
  },
  {
    label: "Left bumper",
    source: { device: "gamepad", type: "button", index: 4 },
    kind: "button",
  },
  {
    label: "Right bumper",
    source: { device: "gamepad", type: "button", index: 5 },
    kind: "button",
  },
];

const PHONE_ROWS: Array<{ label: string; source: InputSource }> = [
  {
    label: "Dial: speed",
    source: { device: "phone", type: "dial", id: "speed" },
  },
  {
    label: "Dial: size",
    source: { device: "phone", type: "dial", id: "size" },
  },
  {
    label: "Dial: density",
    source: { device: "phone", type: "dial", id: "density" },
  },
  {
    label: "XY pad X axis",
    source: { device: "phone", type: "xy", axis: "x" },
  },
  {
    label: "XY pad Y axis",
    source: { device: "phone", type: "xy", axis: "y" },
  },
];

function findActiveGamepad(): Gamepad | null {
  const gamepads = navigator.getGamepads();
  for (let index = 0; index < gamepads.length; index += 1) {
    const gamepad = gamepads[index];
    if (gamepad?.connected) {
      return gamepad;
    }
  }
  return null;
}

function readGamepadValue(row: GamepadInputRow): number {
  const gamepad = findActiveGamepad();
  if (!gamepad) {
    return 0;
  }

  if (row.kind === "axis" && row.axisIndex !== undefined) {
    const raw = gamepad.axes[row.axisIndex] ?? 0;
    if (
      row.axisIndex === GAMEPAD_AXIS_LEFT_TRIGGER ||
      row.axisIndex === GAMEPAD_AXIS_RIGHT_TRIGGER
    ) {
      return normalizeGamepadTrigger(raw);
    }
    return normalizeGamepadAxis(raw);
  }

  if (row.kind === "button" && row.source.device === "gamepad") {
    const index = row.source.index;
    return normalizeGamepadTrigger(gamepad.buttons[index]?.value ?? 0);
  }

  return 0;
}

function MappingRow({
  label,
  source,
  liveValue,
  variableIds,
  targetId,
  onSelect,
}: {
  label: string;
  source: InputSource;
  liveValue?: number;
  variableIds: string[];
  targetId: string | null;
  onSelect: (variableId: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-24 shrink-0 truncate text-[9px] text-white/70">
        {label}
      </span>
      {liveValue !== undefined ? (
        <div className="h-1.5 w-10 shrink-0 overflow-hidden rounded bg-white/10">
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${Math.round(liveValue * 100)}%`,
              backgroundColor: ACCENT,
            }}
          />
        </div>
      ) : null}
      <span className="text-white/30">→</span>
      <select
        className="min-w-0 flex-1 rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white outline-none"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
        value={targetId ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          onSelect(value || null);
        }}
      >
        <option value="">-- none --</option>
        {variableIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </div>
  );
}

export function InputsTab() {
  const variablesRecord = useVariableStore((state) => state.variables);
  const variableIds = useMemo(
    () => Object.values(variablesRecord).map((variable) => variable.id),
    [variablesRecord],
  );
  const mappings = useMappingStore((state) => state.mappings);
  const setMapping = useMappingStore((state) => state.setMapping);
  const removeMapping = useMappingStore((state) => state.removeMapping);
  const reset = useMappingStore((state) => state.reset);

  const [liveValues, setLiveValues] = useState<Record<string, number>>({});

  useEffect(() => {
    let frameId = 0;

    const poll = () => {
      const next: Record<string, number> = {};
      for (const row of GAMEPAD_ROWS) {
        next[sourceKey(row.source)] = readGamepadValue(row);
      }
      setLiveValues(next);
      frameId = requestAnimationFrame(poll);
    };

    frameId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const getTargetForSource = (source: InputSource): string | null => {
    const key = sourceKey(source);
    const mapping = mappings.find((entry) => sourceKey(entry.source) === key);
    return mapping?.targetVariableId ?? null;
  };

  const handleSelect = (source: InputSource, variableId: string | null) => {
    if (variableId) {
      setMapping(source, variableId);
    } else {
      removeMapping(source);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] tracking-wider text-white/50">
              GAMEPAD
            </span>
            <button
              type="button"
              className="text-[8px] hover:underline"
              style={{ color: ACCENT }}
              onClick={() => reset()}
            >
              Reset to defaults
            </button>
          </div>
          {GAMEPAD_ROWS.map((row) => (
            <MappingRow
              key={sourceKey(row.source)}
              label={row.label}
              source={row.source}
              liveValue={liveValues[sourceKey(row.source)] ?? 0}
              variableIds={variableIds}
              targetId={getTargetForSource(row.source)}
              onSelect={(variableId) => handleSelect(row.source, variableId)}
            />
          ))}
        </div>

        <div>
          <span className="mb-2 block text-[9px] tracking-wider text-white/50">
            PHONE
          </span>
          {PHONE_ROWS.map((row) => (
            <MappingRow
              key={sourceKey(row.source)}
              label={row.label}
              source={row.source}
              variableIds={variableIds}
              targetId={getTargetForSource(row.source)}
              onSelect={(variableId) => handleSelect(row.source, variableId)}
            />
          ))}
        </div>
      </div>

      <p className="text-[8px] text-white/30">
        Mappings are saved automatically and persist between sessions.
      </p>
    </div>
  );
}
