import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClientStorage } from "@/lib/persist-storage";

export type LayerType = "threejs" | "p5" | "media";

export type P5SketchType =
  | "noise_field"
  | "image_displace"
  | "typography"
  | "draw"
  | "shader";

export type ThreeGeometry =
  | "sphere"
  | "box"
  | "icosahedron"
  | "torus"
  | "blob"
  | "points";

export type ThreeMaterial = "standard" | "wireframe" | "points";

export type ThreeLightType = "ambient" | "point" | "directional" | "spot";

export type MediaFit = "cover" | "contain" | "fill" | "tile";

export type ThreeObject = {
  id: string;
  geometry: ThreeGeometry;
  count: number;
  bindings: {
    posX?: string;
    posY?: string;
    posZ?: string;
    scale?: string;
    rotationSpeed?: string;
  };
  material: ThreeMaterial;
  colour: string;
};

export type ThreeLight = {
  id: string;
  type: ThreeLightType;
  bindings: {
    intensity?: string;
    colourHue?: string;
    posX?: string;
    posY?: string;
    posZ?: string;
  };
  defaultIntensity: number;
  defaultColour: string;
};

export type ThreeJSLayerConfig = {
  objects: ThreeObject[];
  lights: ThreeLight[];
  cameraBindings: {
    posX?: string;
    posY?: string;
    posZ?: string;
  };
};

export type P5LayerConfig = {
  sketch: P5SketchType;
  bindings: Record<string, string>;
  imageSrc?: string | null;
  text?: string;
  shaderSource?: string;
};

export type MediaLayerConfig = {
  mediaType: "image" | "video";
  src: string | null;
  fit: MediaFit;
  bindings: {
    opacity?: string;
    scaleX?: string;
    scaleY?: string;
    posX?: string;
    posY?: string;
    hue?: string;
    brightness?: string;
    blur?: string;
    speed?: string;
    scrub?: string;
  };
};

export type Layer = {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  config: ThreeJSLayerConfig | P5LayerConfig | MediaLayerConfig;
};

export type LayerStore = {
  layers: Layer[];
  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (orderedIds: string[]) => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerName: (id: string, name: string) => void;
  updateLayerConfig: (
    id: string,
    config: Partial<ThreeJSLayerConfig | P5LayerConfig | MediaLayerConfig>,
  ) => void;
  setMediaSrc: (
    id: string,
    src: string,
    mediaType: MediaLayerConfig["mediaType"],
  ) => void;
  setP5ImageSrc: (id: string, src: string) => void;
  getLayer: (id: string) => Layer | undefined;
  initialise: () => void;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DEFAULT_SHADER_SOURCE = `
precision mediump float;
uniform float uTime;
uniform float uSpeed;
uniform float uHue;
uniform float uScale;
uniform vec2 uResolution;

vec3 hueRotate(vec3 color, float hue) {
  float angle = hue * 6.28318;
  float cosA = cos(angle);
  float sinA = sin(angle);
  mat3 rot = mat3(
    0.299 + 0.701 * cosA + 0.168 * sinA,
    0.587 - 0.587 * cosA + 0.330 * sinA,
    0.114 - 0.114 * cosA - 0.497 * sinA,
    0.299 - 0.299 * cosA - 0.328 * sinA,
    0.587 + 0.413 * cosA + 0.035 * sinA,
    0.114 - 0.114 * cosA + 0.292 * sinA,
    0.299 - 0.300 * cosA + 1.250 * sinA,
    0.587 - 0.588 * cosA - 1.050 * sinA,
    0.114 + 0.886 * cosA - 0.203 * sinA
  );
  return clamp(rot * color, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * (0.2 + uSpeed * 2.0);
  vec3 base = vec3(
    sin(uv.x * uScale * 8.0 + t) * 0.5 + 0.5,
    sin(uv.y * uScale * 6.0 - t * 0.7) * 0.5 + 0.5,
    sin((uv.x + uv.y) * uScale * 4.0 + t * 1.3) * 0.5 + 0.5
  );
  gl_FragColor = vec4(hueRotate(base, uHue), 1.0);
}
`.trim();

export const DEFAULT_LAYERS: Layer[] = [
  {
    id: "layer-p5-noise",
    type: "p5",
    name: "Noise Field",
    visible: true,
    opacity: 1,
    zIndex: 0,
    config: {
      sketch: "noise_field",
      bindings: {
        density: "density",
        speed: "speed",
        hue: "hue",
        trail: "trail",
      },
    },
  },
  {
    id: "layer-three-icosa",
    type: "threejs",
    name: "Icosahedron",
    visible: true,
    opacity: 1,
    zIndex: 1,
    config: {
      objects: [
        {
          id: "obj-icosahedron",
          geometry: "icosahedron",
          count: 1,
          material: "wireframe",
          colour: "#f59e0b",
          bindings: {
            scale: "size",
            rotationSpeed: "speed",
            posX: "xy_x",
            posY: "xy_y",
          },
        },
      ],
      lights: [
        {
          id: "light-ambient",
          type: "ambient",
          defaultIntensity: 0.4,
          defaultColour: "#ffffff",
          bindings: {},
        },
        {
          id: "light-point",
          type: "point",
          defaultIntensity: 2,
          defaultColour: "#f59e0b",
          bindings: {
            intensity: "density",
            colourHue: "hue",
          },
        },
      ],
      cameraBindings: {},
    },
  },
];

function defaultConfigForType(type: LayerType): Layer["config"] {
  switch (type) {
    case "threejs":
      return {
        objects: [
          {
            id: createId("obj"),
            geometry: "sphere",
            count: 1,
            material: "standard",
            colour: "#f59e0b",
            bindings: {},
          },
        ],
        lights: [
          {
            id: createId("light"),
            type: "ambient",
            defaultIntensity: 0.5,
            defaultColour: "#ffffff",
            bindings: {},
          },
        ],
        cameraBindings: {},
      };
    case "p5":
      return {
        sketch: "noise_field",
        bindings: {
          density: "density",
          speed: "speed",
          hue: "hue",
          trail: "trail",
        },
        imageSrc: null,
        text: "PLAY",
        shaderSource: DEFAULT_SHADER_SOURCE,
      };
    case "media":
      return {
        mediaType: "image",
        src: null,
        fit: "cover",
        bindings: {},
      };
  }
}

function defaultNameForType(type: LayerType): string {
  switch (type) {
    case "threejs":
      return "Three.js Layer";
    case "p5":
      return "p5 Layer";
    case "media":
      return "Media Layer";
  }
}

function stripTransientFromLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => {
    if (layer.type === "media") {
      const config = layer.config as MediaLayerConfig;
      return {
        ...layer,
        config: { ...config, src: null },
      };
    }

    if (layer.type === "p5") {
      const config = layer.config as P5LayerConfig;
      return {
        ...layer,
        config: { ...config, imageSrc: null },
      };
    }

    return layer;
  });
}

export const useLayerStore = create<LayerStore>()(
  persist(
    (set, get) => ({
      layers: DEFAULT_LAYERS,

      addLayer: (type) => {
        const layers = get().layers;
        const maxZ = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
        const newLayer: Layer = {
          id: createId("layer"),
          type,
          name: defaultNameForType(type),
          visible: true,
          opacity: 1,
          zIndex: maxZ + 1,
          config: defaultConfigForType(type),
        };
        set({ layers: [...layers, newLayer] });
      },

      removeLayer: (id) => {
        set({ layers: get().layers.filter((layer) => layer.id !== id) });
      },

      reorderLayers: (orderedIds) => {
        const layerMap = new Map(get().layers.map((layer) => [layer.id, layer]));
        const reordered = orderedIds
          .map((id, index) => {
            const layer = layerMap.get(id);
            if (!layer) {
              return null;
            }
            return { ...layer, zIndex: index };
          })
          .filter((layer): layer is Layer => layer !== null);

        const missing = get().layers.filter(
          (layer) => !orderedIds.includes(layer.id),
        );
        const next = [...reordered, ...missing].map((layer, index) => ({
          ...layer,
          zIndex: index,
        }));

        set({ layers: next });
      },

      setLayerVisibility: (id, visible) => {
        set({
          layers: get().layers.map((layer) =>
            layer.id === id ? { ...layer, visible } : layer,
          ),
        });
      },

      setLayerOpacity: (id, opacity) => {
        set({
          layers: get().layers.map((layer) =>
            layer.id === id ? { ...layer, opacity: clamp01(opacity) } : layer,
          ),
        });
      },

      setLayerName: (id, name) => {
        set({
          layers: get().layers.map((layer) =>
            layer.id === id ? { ...layer, name } : layer,
          ),
        });
      },

      updateLayerConfig: (id, config) => {
        set({
          layers: get().layers.map((layer) => {
            if (layer.id !== id) {
              return layer;
            }
            return {
              ...layer,
              config: { ...layer.config, ...config } as Layer["config"],
            };
          }),
        });
      },

      setMediaSrc: (id, src, mediaType) => {
        set({
          layers: get().layers.map((layer) => {
            if (layer.id !== id || layer.type !== "media") {
              return layer;
            }
            const config = layer.config as MediaLayerConfig;
            return {
              ...layer,
              config: { ...config, src, mediaType },
            };
          }),
        });
      },

      setP5ImageSrc: (id, src) => {
        set({
          layers: get().layers.map((layer) => {
            if (layer.id !== id || layer.type !== "p5") {
              return layer;
            }
            const config = layer.config as P5LayerConfig;
            return {
              ...layer,
              config: { ...config, imageSrc: src },
            };
          }),
        });
      },

      getLayer: (id) => get().layers.find((layer) => layer.id === id),

      initialise: () => {
        if (get().layers.length === 0) {
          set({ layers: DEFAULT_LAYERS });
        }
      },
    }),
    {
      name: "play-layers",
      storage: createClientStorage(),
      partialize: (state) => ({
        layers: stripTransientFromLayers(state.layers),
      }),
    },
  ),
);
