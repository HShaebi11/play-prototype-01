import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DIAL_DEFAULT_DENSITY,
  DIAL_DEFAULT_SIZE,
  DIAL_DEFAULT_SPEED,
  XY_PAD_DEFAULT,
} from "@/lib/constants";
import { useMappingStore, type InputSource } from "@/lib/mappings";
import { createClientStorage } from "@/lib/persist-storage";
import { useVariableStore } from "@/lib/variables";

export type ControllerControlType = "dial" | "slider" | "xy" | "mode";

export type ControllerControl = {
  id: string;
  type: ControllerControlType;
  label: string;
  description: string;
  targetVariableId?: string;
  targetVariableXId?: string;
  targetVariableYId?: string;
  defaultValue?: number;
  defaultX?: number;
  defaultY?: number;
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
  removeControl: (tabId: string, controlId: string) => void;
  reset: () => void;
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

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
          defaultValue: DIAL_DEFAULT_SPEED,
        },
        {
          id: "size",
          type: "dial",
          label: "size",
          description: "Object scale — Three.js mesh size",
          targetVariableId: "size",
          defaultValue: DIAL_DEFAULT_SIZE,
        },
        {
          id: "density",
          type: "dial",
          label: "density",
          description: "Particle density — p5 noise field count",
          targetVariableId: "density",
          defaultValue: DIAL_DEFAULT_DENSITY,
        },
        {
          id: "xy_main",
          type: "xy",
          label: "XY",
          description: "Hue (X axis) and trail mix (Y axis)",
          targetVariableXId: "hue",
          targetVariableYId: "trail",
          defaultX: XY_PAD_DEFAULT,
          defaultY: 0.2,
        },
        {
          id: "mode",
          type: "mode",
          label: "Mode",
          description: "Visual mode — geo, audio, or colour",
        },
      ],
    },
  ],
};

function defaultControlForType(type: ControllerControlType): ControllerControl {
  const id = createId(type);

  switch (type) {
    case "dial":
      return {
        id,
        type,
        label: "dial",
        description: "Describe what this dial controls",
        targetVariableId: id,
        defaultValue: 0.5,
      };
    case "slider":
      return {
        id,
        type,
        label: "slider",
        description: "Describe what this slider controls",
        targetVariableId: id,
        defaultValue: 0.5,
      };
    case "xy":
      return {
        id,
        type,
        label: "XY",
        description: "Describe what the X and Y axes control",
        targetVariableXId: "xy_x",
        targetVariableYId: "xy_y",
        defaultX: XY_PAD_DEFAULT,
        defaultY: XY_PAD_DEFAULT,
      };
    case "mode":
      return {
        id,
        type,
        label: "Mode",
        description: "Switches visual mode (geo / audio / colour)",
      };
  }
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

export function syncVariablesFromConfig(config: ControllerConfig): void {
  const { ensure } = useVariableStore.getState();

  for (const tab of config.tabs) {
    for (const control of tab.controls) {
      if (control.targetVariableId) {
        ensure({
          id: control.targetVariableId,
          label: control.label,
          description: control.description,
          defaultValue: control.defaultValue,
        });
      }

      if (control.targetVariableXId) {
        ensure({
          id: control.targetVariableXId,
          label: `${control.label} X`,
          description: control.description,
          defaultValue: control.defaultX,
        });
      }

      if (control.targetVariableYId) {
        ensure({
          id: control.targetVariableYId,
          label: `${control.label} Y`,
          description: control.description,
          defaultValue: control.defaultY,
        });
      }
    }
  }
}

export function syncMappingsFromConfig(config: ControllerConfig): void {
  syncVariablesFromConfig(config);
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
        const control = defaultControlForType(type);
        const config = {
          tabs: get().config.tabs.map((tab) =>
            tab.id === tabId
              ? { ...tab, controls: [...tab.controls, control] }
              : tab,
          ),
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
      onRehydrateStorage: () => (state) => {
        if (state?.config) {
          syncMappingsFromConfig(state.config);
        }
      },
    },
  ),
);
