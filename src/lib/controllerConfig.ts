import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMappingStore, type InputSource } from "@/lib/mappings";
import { createClientStorage } from "@/lib/persist-storage";

export type ControllerControlType = "dial" | "slider" | "xy" | "mode";

export type ControlLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ControllerControl = {
  id: string;
  type: ControllerControlType;
  label: string;
  description: string;
  layout: ControlLayout;
  targetVariableId?: string;
  targetVariableXId?: string;
  targetVariableYId?: string;
};

export type ControllerTab = {
  id: string;
  label: string;
  controls: ControllerControl[];
};

export type ControllerConfig = {
  tabs: ControllerTab[];
};

export type ControllerConfigStore = {
  config: ControllerConfig;
  addTab: (label?: string) => void;
  updateTab: (tabId: string, patch: Partial<Pick<ControllerTab, "label">>) => void;
  removeTab: (tabId: string) => void;
  addControl: (tabId: string, type: ControllerControlType) => void;
  updateControl: (
    tabId: string,
    controlId: string,
    patch: Partial<ControllerControl>,
  ) => void;
  updateControlLayout: (
    tabId: string,
    controlId: string,
    layout: Partial<ControlLayout>,
  ) => void;
  removeControl: (tabId: string, controlId: string) => void;
  reset: () => void;
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function snapToGrid(value: number, grid = 0.05): number {
  return Math.round(value / grid) * grid;
}

export function defaultLayoutForType(
  type: ControllerControlType,
  index: number,
): ControlLayout {
  switch (type) {
    case "dial":
      return {
        x: snapToGrid(0.02 + index * 0.14),
        y: 0.08,
        w: 0.12,
        h: 0.55,
      };
    case "slider":
      return {
        x: snapToGrid(0.02 + index * 0.22),
        y: 0.15,
        w: 0.2,
        h: 0.12,
      };
    case "xy":
      return { x: 0.38, y: 0.08, w: 0.38, h: 0.72 };
    case "mode":
      return { x: 0.02, y: 0.78, w: 0.96, h: 0.18 };
  }
}

const MAIN_TAB_LAYOUTS: ControlLayout[] = [
  { x: 0.02, y: 0.1, w: 0.12, h: 0.55 },
  { x: 0.16, y: 0.1, w: 0.12, h: 0.55 },
  { x: 0.3, y: 0.1, w: 0.12, h: 0.55 },
  { x: 0.46, y: 0.08, w: 0.38, h: 0.72 },
  { x: 0.02, y: 0.78, w: 0.96, h: 0.18 },
];

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  tabs: [
    {
      id: "tab-main",
      label: "MAIN",
      controls: [
        {
          id: "speed",
          type: "dial",
          label: "speed",
          description: "Animation speed — drives layer motion rate",
          targetVariableId: "speed",
          layout: MAIN_TAB_LAYOUTS[0],
        },
        {
          id: "size",
          type: "dial",
          label: "size",
          description: "Object scale — Three.js mesh size",
          targetVariableId: "size",
          layout: MAIN_TAB_LAYOUTS[1],
        },
        {
          id: "density",
          type: "dial",
          label: "density",
          description: "Particle density — p5 noise field count",
          targetVariableId: "density",
          layout: MAIN_TAB_LAYOUTS[2],
        },
        {
          id: "xy_main",
          type: "xy",
          label: "XY",
          description: "Hue (X axis) and trail mix (Y axis)",
          targetVariableXId: "hue",
          targetVariableYId: "trail",
          layout: MAIN_TAB_LAYOUTS[3],
        },
        {
          id: "mode",
          type: "mode",
          label: "Mode",
          description: "Visual mode — geo, audio, or colour",
          layout: MAIN_TAB_LAYOUTS[4],
        },
      ],
    },
  ],
};

function defaultControlForType(
  type: ControllerControlType,
  index: number,
): ControllerControl {
  const id = createId(type);

  switch (type) {
    case "dial":
      return {
        id,
        type,
        label: "dial",
        description: "Describe what this dial controls",
        layout: defaultLayoutForType("dial", index),
      };
    case "slider":
      return {
        id,
        type,
        label: "slider",
        description: "Describe what this slider controls",
        layout: defaultLayoutForType("slider", index),
      };
    case "xy":
      return {
        id,
        type,
        label: "XY",
        description: "Describe what the X and Y axes control",
        layout: defaultLayoutForType("xy", index),
      };
    case "mode":
      return {
        id,
        type,
        label: "Mode",
        description: "Switches visual mode (geo / audio / colour)",
        layout: defaultLayoutForType("mode", index),
      };
  }
}

export function migrateControlLayout(
  control: ControllerControl,
  index: number,
): ControllerControl {
  if (control.layout) {
    return control;
  }

  return {
    ...control,
    layout: defaultLayoutForType(control.type, index),
  };
}

export function migrateConfig(config: ControllerConfig): ControllerConfig {
  return {
    tabs: config.tabs.map((tab) => ({
      ...tab,
      controls: tab.controls.map((control, index) =>
        migrateControlLayout(control as ControllerControl, index),
      ),
    })),
  };
}

export function controlToInputSources(control: ControllerControl): InputSource[] {
  switch (control.type) {
    case "dial":
      return [{ device: "phone", type: "dial", id: control.id }];
    case "slider":
      return [{ device: "phone", type: "slider", id: control.id }];
    case "xy":
      return [
        { device: "phone", type: "xy", id: control.id, axis: "x" },
        { device: "phone", type: "xy", id: control.id, axis: "y" },
      ];
    case "mode":
      return [];
  }
}

export function syncMappingsFromConfig(config: ControllerConfig): void {
  const { setMapping, removeMapping } = useMappingStore.getState();

  for (const tab of config.tabs) {
    for (const control of tab.controls) {
      const sources = controlToInputSources(control);

      for (const source of sources) {
        let target: string | null = null;

        if (source.device === "phone" && source.type === "dial") {
          target = control.targetVariableId ?? null;
        } else if (source.device === "phone" && source.type === "slider") {
          target = control.targetVariableId ?? null;
        } else if (source.device === "phone" && source.type === "xy") {
          target =
            source.axis === "x"
              ? (control.targetVariableXId ?? null)
              : (control.targetVariableYId ?? null);
        }

        if (target) {
          setMapping(source, target);
        } else {
          removeMapping(source);
        }
      }
    }
  }
}

export const useControllerConfigStore = create<ControllerConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONTROLLER_CONFIG,

      addTab: (label = "NEW TAB") => {
        const tab: ControllerTab = {
          id: createId("tab"),
          label: label.toUpperCase(),
          controls: [],
        };
        const config = { tabs: [...get().config.tabs, tab] };
        set({ config });
        syncMappingsFromConfig(config);
      },

      updateTab: (tabId, patch) => {
        const config = {
          tabs: get().config.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...patch } : tab,
          ),
        };
        set({ config });
        syncMappingsFromConfig(config);
      },

      removeTab: (tabId) => {
        const tabs = get().config.tabs.filter((tab) => tab.id !== tabId);
        if (tabs.length === 0) {
          return;
        }
        const config = { tabs };
        set({ config });
        syncMappingsFromConfig(config);
      },

      addControl: (tabId, type) => {
        const config = {
          tabs: get().config.tabs.map((tab) => {
            if (tab.id !== tabId) {
              return tab;
            }
            const index = tab.controls.length;
            const control = defaultControlForType(type, index);
            return { ...tab, controls: [...tab.controls, control] };
          }),
        };
        set({ config });
        syncMappingsFromConfig(config);
      },

      updateControl: (tabId, controlId, patch) => {
        const config = {
          tabs: get().config.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  controls: tab.controls.map((control) =>
                    control.id === controlId ? { ...control, ...patch } : control,
                  ),
                }
              : tab,
          ),
        };
        set({ config });
        syncMappingsFromConfig(config);
      },

      updateControlLayout: (tabId, controlId, layoutPatch) => {
        const config = {
          tabs: get().config.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  controls: tab.controls.map((control) => {
                    if (control.id !== controlId) {
                      return control;
                    }
                    const next = {
                      ...control.layout,
                      ...layoutPatch,
                    };
                    return {
                      ...control,
                      layout: {
                        x: clamp01(next.x),
                        y: clamp01(next.y),
                        w: clamp01(Math.max(0.05, next.w)),
                        h: clamp01(Math.max(0.05, next.h)),
                      },
                    };
                  }),
                }
              : tab,
          ),
        };
        set({ config });
      },

      removeControl: (tabId, controlId) => {
        const config = {
          tabs: get().config.tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  controls: tab.controls.filter(
                    (control) => control.id !== controlId,
                  ),
                }
              : tab,
          ),
        };
        set({ config });
        syncMappingsFromConfig(config);
      },

      reset: () => {
        set({ config: DEFAULT_CONTROLLER_CONFIG });
        syncMappingsFromConfig(DEFAULT_CONTROLLER_CONFIG);
      },
    }),
    {
      name: "play-controller-config",
      storage: createClientStorage(),
      merge: (persisted, current) => {
        const merged = {
          ...current,
          ...(persisted as Partial<ControllerConfigStore>),
        };
        if (merged.config) {
          merged.config = migrateConfig(merged.config);
        }
        return merged;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.config) {
          const migrated = migrateConfig(state.config);
          state.config = migrated;
          syncMappingsFromConfig(migrated);
        }
      },
    },
  ),
);
