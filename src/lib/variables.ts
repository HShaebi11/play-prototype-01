import { create } from "zustand";

export type Variable = {
  id: string;
  value: number;
  label: string;
  source: "phone" | "gamepad" | "internal";
};

export type VariableStore = {
  variables: Record<string, Variable>;
  set: (id: string, value: number, source: Variable["source"]) => void;
  get: (id: string) => number;
  getAll: () => Variable[];
  initialise: (defaults: Array<Omit<Variable, "source">>) => void;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export const DEFAULT_VARIABLES: Array<Omit<Variable, "source">> = [
  { id: "speed", label: "Speed", value: 0.3 },
  { id: "size", label: "Size", value: 0.5 },
  { id: "density", label: "Density", value: 0.4 },
  { id: "hue", label: "Hue", value: 0.0 },
  { id: "trail", label: "Trail", value: 0.2 },
  { id: "xy_x", label: "XY — X", value: 0.5 },
  { id: "xy_y", label: "XY — Y", value: 0.5 },
];

export const useVariableStore = create<VariableStore>((set, get) => ({
  variables: {},

  set: (id, value, source) => {
    set((state) => {
      const existing = state.variables[id];
      if (!existing) {
        return state;
      }

      return {
        variables: {
          ...state.variables,
          [id]: {
            ...existing,
            value: clamp01(value),
            source,
          },
        },
      };
    });
  },

  get: (id) => {
    return get().variables[id]?.value ?? 0;
  },

  getAll: () => Object.values(get().variables),

  initialise: (defaults) => {
    set({
      variables: Object.fromEntries(
        defaults.map((variable) => [
          variable.id,
          { ...variable, source: "internal" as const },
        ]),
      ),
    });
  },
}));
