import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientStorage } from "@/lib/persist-storage";

export type Variable = {
  id: string;
  value: number;
  label: string;
  description: string;
  source: "phone" | "gamepad" | "internal";
};

export type VariableDefinition = Omit<Variable, "source" | "value"> & {
  defaultValue?: number;
};

export type VariableStore = {
  variables: Record<string, Variable>;
  set: (id: string, value: number, source: Variable["source"]) => void;
  get: (id: string) => number;
  getAll: () => Variable[];
  initialise: (defaults: VariableDefinition[]) => void;
  add: (definition: VariableDefinition) => void;
  update: (
    id: string,
    patch: Partial<Pick<Variable, "label" | "description">>,
  ) => void;
  remove: (id: string) => void;
  ensure: (definition: VariableDefinition) => void;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export const DEFAULT_VARIABLES: VariableDefinition[] = [
  {
    id: "speed",
    label: "Speed",
    description: "Animation speed — layer motion rate",
    defaultValue: 0.3,
  },
  {
    id: "size",
    label: "Size",
    description: "Object scale — Three.js mesh size",
    defaultValue: 0.5,
  },
  {
    id: "density",
    label: "Density",
    description: "Particle density — p5 noise field count",
    defaultValue: 0.4,
  },
  {
    id: "hue",
    label: "Hue",
    description: "Colour hue rotation",
    defaultValue: 0.0,
  },
  {
    id: "trail",
    label: "Trail",
    description: "Trail opacity / effects mix",
    defaultValue: 0.2,
  },
  {
    id: "xy_x",
    label: "XY — X",
    description: "Horizontal position / camera X",
    defaultValue: 0.5,
  },
  {
    id: "xy_y",
    label: "XY — Y",
    description: "Vertical position / camera Y",
    defaultValue: 0.5,
  },
];

function definitionToVariable(definition: VariableDefinition): Variable {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    value: clamp01(definition.defaultValue ?? 0.5),
    source: "internal",
  };
}

export const useVariableStore = create<VariableStore>()(
  persist(
    (set, get) => ({
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
        const current = get().variables;
        if (Object.keys(current).length > 0) {
          return;
        }

        set({
          variables: Object.fromEntries(
            defaults.map((definition) => [
              definition.id,
              definitionToVariable(definition),
            ]),
          ),
        });
      },

      add: (definition) => {
        set((state) => {
          if (state.variables[definition.id]) {
            return state;
          }

          return {
            variables: {
              ...state.variables,
              [definition.id]: definitionToVariable(definition),
            },
          };
        });
      },

      update: (id, patch) => {
        set((state) => {
          const existing = state.variables[id];
          if (!existing) {
            return state;
          }

          return {
            variables: {
              ...state.variables,
              [id]: { ...existing, ...patch },
            },
          };
        });
      },

      remove: (id) => {
        set((state) => {
          if (!state.variables[id]) {
            return state;
          }

          const { [id]: _removed, ...rest } = state.variables;
          return { variables: rest };
        });
      },

      ensure: (definition) => {
        if (!get().variables[definition.id]) {
          get().add(definition);
        }
      },
    }),
    {
      name: "play-variables",
      storage: createClientStorage(),
      partialize: (state) => ({
        variables: Object.fromEntries(
          Object.entries(state.variables).map(([id, variable]) => [
            id,
            {
              id: variable.id,
              label: variable.label,
              description: variable.description,
              value: variable.value,
              source: "internal" as const,
            },
          ]),
        ),
      }),
    },
  ),
);
