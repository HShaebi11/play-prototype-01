import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InputSource =
  | { device: "gamepad"; type: "axis"; index: number }
  | { device: "gamepad"; type: "button"; index: number }
  | { device: "phone"; type: "dial"; id: string }
  | { device: "phone"; type: "xy"; axis: "x" | "y" };

export type InputMapping = {
  source: InputSource;
  targetVariableId: string;
  label: string;
};

export type MappingStore = {
  mappings: InputMapping[];
  setMapping: (source: InputSource, targetVariableId: string) => void;
  removeMapping: (source: InputSource) => void;
  getTarget: (source: InputSource) => string | null;
  reset: () => void;
};

export function sourceKey(source: InputSource): string {
  if (source.device === "phone" && source.type === "dial") {
    return `phone:dial:${source.id}`;
  }

  if (source.device === "phone" && source.type === "xy") {
    return `phone:xy:${source.axis}`;
  }

  return `${source.device}:${source.type}:${source.index}`;
}

export const DEFAULT_MAPPINGS: InputMapping[] = [
  {
    source: { device: "gamepad", type: "axis", index: 0 },
    targetVariableId: "xy_x",
    label: "Left stick X",
  },
  {
    source: { device: "gamepad", type: "axis", index: 1 },
    targetVariableId: "xy_y",
    label: "Left stick Y",
  },
  {
    source: { device: "gamepad", type: "axis", index: 2 },
    targetVariableId: "speed",
    label: "Right stick X",
  },
  {
    source: { device: "gamepad", type: "axis", index: 3 },
    targetVariableId: "size",
    label: "Right stick Y",
  },
  {
    source: { device: "gamepad", type: "axis", index: 4 },
    targetVariableId: "density",
    label: "Left trigger",
  },
  {
    source: { device: "gamepad", type: "axis", index: 5 },
    targetVariableId: "hue",
    label: "Right trigger",
  },
  {
    source: { device: "gamepad", type: "button", index: 4 },
    targetVariableId: "trail",
    label: "Left bumper",
  },
  {
    source: { device: "gamepad", type: "button", index: 6 },
    targetVariableId: "density",
    label: "Left trigger (button)",
  },
  {
    source: { device: "gamepad", type: "button", index: 7 },
    targetVariableId: "hue",
    label: "Right trigger (button)",
  },
  {
    source: { device: "phone", type: "dial", id: "speed" },
    targetVariableId: "speed",
    label: "Speed dial",
  },
  {
    source: { device: "phone", type: "dial", id: "size" },
    targetVariableId: "size",
    label: "Size dial",
  },
  {
    source: { device: "phone", type: "dial", id: "density" },
    targetVariableId: "density",
    label: "Density dial",
  },
  {
    source: { device: "phone", type: "xy", axis: "x" },
    targetVariableId: "hue",
    label: "XY pad X",
  },
  {
    source: { device: "phone", type: "xy", axis: "y" },
    targetVariableId: "trail",
    label: "XY pad Y",
  },
];

export const useMappingStore = create<MappingStore>()(
  persist(
    (set, get) => ({
      mappings: DEFAULT_MAPPINGS,

      setMapping: (source, targetVariableId) => {
        const key = sourceKey(source);
        set((state) => {
          const existingIndex = state.mappings.findIndex(
            (mapping) => sourceKey(mapping.source) === key,
          );
          const label =
            existingIndex >= 0
              ? state.mappings[existingIndex].label
              : sourceKey(source);

          const nextMapping: InputMapping = {
            source,
            targetVariableId,
            label,
          };

          if (existingIndex >= 0) {
            const mappings = [...state.mappings];
            mappings[existingIndex] = nextMapping;
            return { mappings };
          }

          return { mappings: [...state.mappings, nextMapping] };
        });
      },

      removeMapping: (source) => {
        const key = sourceKey(source);
        set((state) => ({
          mappings: state.mappings.filter(
            (mapping) => sourceKey(mapping.source) !== key,
          ),
        }));
      },

      getTarget: (source) => {
        const key = sourceKey(source);
        const mapping = get().mappings.find(
          (entry) => sourceKey(entry.source) === key,
        );
        return mapping?.targetVariableId ?? null;
      },

      reset: () => {
        set({ mappings: DEFAULT_MAPPINGS });
      },
    }),
    {
      name: "play-mappings",
    },
  ),
);
