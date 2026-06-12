"use client";

import { useState } from "react";
import type {
  ThreeGeometry,
  ThreeJSLayerConfig,
  ThreeLight,
  ThreeLightType,
  ThreeObject,
} from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { ACCENT } from "@/lib/constants";

type ThreeLayerConfigPanelProps = {
  layerId: string;
};

const GEOMETRY_OPTIONS: ThreeGeometry[] = [
  "sphere",
  "box",
  "icosahedron",
  "torus",
  "blob",
  "points",
];

const LIGHT_OPTIONS: ThreeLightType[] = [
  "ambient",
  "point",
  "directional",
  "spot",
];

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function BindingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-[9px] text-white/60">
      <span className="w-20 shrink-0">{label}</span>
      <input
        className="min-w-0 flex-1 rounded border bg-black/30 px-1 py-0.5 font-mono text-[9px] text-white outline-none"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
        value={value ?? ""}
        placeholder="—"
        onChange={(event) => {
          const next = event.target.value.trim();
          onChange(next || undefined);
        }}
      />
    </label>
  );
}

function ObjectEditor({
  object,
  onChange,
  onRemove,
}: {
  object: ThreeObject;
  onChange: (object: ThreeObject) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="mb-2 rounded border p-2"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="rounded px-1 py-0.5 text-[8px] font-semibold uppercase"
          style={{ color: ACCENT, border: `1px solid ${ACCENT}` }}
        >
          {object.geometry} ×{object.count}
        </span>
        <button
          type="button"
          className="text-white/40 hover:text-red-400"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <BindingInput
          label="posX"
          value={object.bindings.posX}
          onChange={(posX) =>
            onChange({ ...object, bindings: { ...object.bindings, posX } })
          }
        />
        <BindingInput
          label="posY"
          value={object.bindings.posY}
          onChange={(posY) =>
            onChange({ ...object, bindings: { ...object.bindings, posY } })
          }
        />
        <BindingInput
          label="posZ"
          value={object.bindings.posZ}
          onChange={(posZ) =>
            onChange({ ...object, bindings: { ...object.bindings, posZ } })
          }
        />
        <BindingInput
          label="scale"
          value={object.bindings.scale}
          onChange={(scale) =>
            onChange({ ...object, bindings: { ...object.bindings, scale } })
          }
        />
        <BindingInput
          label="rotationSpeed"
          value={object.bindings.rotationSpeed}
          onChange={(rotationSpeed) =>
            onChange({
              ...object,
              bindings: { ...object.bindings, rotationSpeed },
            })
          }
        />
      </div>
    </div>
  );
}

function LightEditor({
  light,
  onChange,
  onRemove,
}: {
  light: ThreeLight;
  onChange: (light: ThreeLight) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="mb-2 rounded border p-2"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="rounded px-1 py-0.5 text-[8px] font-semibold uppercase text-white/80"
          style={{ border: "1px solid rgba(255,255,255,0.3)" }}
        >
          {light.type}
        </span>
        <button
          type="button"
          className="text-white/40 hover:text-red-400"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <BindingInput
          label="intensity"
          value={light.bindings.intensity}
          onChange={(intensity) =>
            onChange({ ...light, bindings: { ...light.bindings, intensity } })
          }
        />
        <BindingInput
          label="colourHue"
          value={light.bindings.colourHue}
          onChange={(colourHue) =>
            onChange({ ...light, bindings: { ...light.bindings, colourHue } })
          }
        />
        <BindingInput
          label="posX"
          value={light.bindings.posX}
          onChange={(posX) =>
            onChange({ ...light, bindings: { ...light.bindings, posX } })
          }
        />
        <BindingInput
          label="posY"
          value={light.bindings.posY}
          onChange={(posY) =>
            onChange({ ...light, bindings: { ...light.bindings, posY } })
          }
        />
        <BindingInput
          label="posZ"
          value={light.bindings.posZ}
          onChange={(posZ) =>
            onChange({ ...light, bindings: { ...light.bindings, posZ } })
          }
        />
      </div>
    </div>
  );
}

export function ThreeLayerConfigPanel({ layerId }: ThreeLayerConfigPanelProps) {
  const layer = useLayerStore((state) => state.getLayer(layerId));
  const updateLayerConfig = useLayerStore((state) => state.updateLayerConfig);

  const [showObjectPicker, setShowObjectPicker] = useState(false);
  const [showLightPicker, setShowLightPicker] = useState(false);
  const [newGeometry, setNewGeometry] = useState<ThreeGeometry>("sphere");
  const [newCount, setNewCount] = useState(1);
  const [newLightType, setNewLightType] = useState<ThreeLightType>("point");

  if (!layer || layer.type !== "threejs") {
    return null;
  }

  const config = layer.config as ThreeJSLayerConfig;

  const saveConfig = (next: Partial<ThreeJSLayerConfig>) => {
    updateLayerConfig(layerId, next);
  };

  const updateObject = (index: number, object: ThreeObject) => {
    const objects = [...config.objects];
    objects[index] = object;
    saveConfig({ objects });
  };

  const removeObject = (index: number) => {
    saveConfig({ objects: config.objects.filter((_, i) => i !== index) });
  };

  const addObject = () => {
    const object: ThreeObject = {
      id: createId("obj"),
      geometry: newGeometry,
      count: Math.max(1, newCount),
      material: "standard",
      colour: ACCENT,
      bindings: {},
    };
    saveConfig({ objects: [...config.objects, object] });
    setShowObjectPicker(false);
  };

  const updateLight = (index: number, light: ThreeLight) => {
    const lights = [...config.lights];
    lights[index] = light;
    saveConfig({ lights });
  };

  const removeLight = (index: number) => {
    saveConfig({ lights: config.lights.filter((_, i) => i !== index) });
  };

  const addLight = () => {
    const light: ThreeLight = {
      id: createId("light"),
      type: newLightType,
      defaultIntensity: 1,
      defaultColour: "#ffffff",
      bindings: {},
    };
    saveConfig({ lights: [...config.lights, light] });
    setShowLightPicker(false);
  };

  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          OBJECTS
        </span>
        {config.objects.map((object, index) => (
          <ObjectEditor
            key={object.id}
            object={object}
            onChange={(next) => updateObject(index, next)}
            onRemove={() => removeObject(index)}
          />
        ))}
        <div className="relative">
          <button
            type="button"
            className="text-[9px] hover:underline"
            style={{ color: ACCENT }}
            onClick={() => setShowObjectPicker((visible) => !visible)}
          >
            + Add Object
          </button>
          {showObjectPicker ? (
            <div
              className="mt-1 rounded border bg-[#0a0a0a] p-2"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <select
                className="mb-2 w-full rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white"
                value={newGeometry}
                onChange={(event) =>
                  setNewGeometry(event.target.value as ThreeGeometry)
                }
              >
                {GEOMETRY_OPTIONS.map((geometry) => (
                  <option key={geometry} value={geometry}>
                    {geometry}
                  </option>
                ))}
              </select>
              <label className="mb-2 flex items-center gap-2 text-[9px] text-white/70">
                Count
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border bg-black/40 px-1 py-0.5 text-white"
                  value={newCount}
                  onChange={(event) =>
                    setNewCount(Number.parseInt(event.target.value, 10) || 1)
                  }
                />
              </label>
              <button
                type="button"
                className="w-full rounded py-1 text-[9px] text-black"
                style={{ backgroundColor: ACCENT }}
                onClick={addObject}
              >
                Add
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          LIGHTS
        </span>
        {config.lights.map((light, index) => (
          <LightEditor
            key={light.id}
            light={light}
            onChange={(next) => updateLight(index, next)}
            onRemove={() => removeLight(index)}
          />
        ))}
        <div className="relative">
          <button
            type="button"
            className="text-[9px] hover:underline"
            style={{ color: ACCENT }}
            onClick={() => setShowLightPicker((visible) => !visible)}
          >
            + Add Light
          </button>
          {showLightPicker ? (
            <div
              className="mt-1 rounded border bg-[#0a0a0a] p-2"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <select
                className="mb-2 w-full rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white"
                value={newLightType}
                onChange={(event) =>
                  setNewLightType(event.target.value as ThreeLightType)
                }
              >
                {LIGHT_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="w-full rounded py-1 text-[9px] text-black"
                style={{ backgroundColor: ACCENT }}
                onClick={addLight}
              >
                Add
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          CAMERA
        </span>
        <div className="flex flex-col gap-1">
          <BindingInput
            label="posX"
            value={config.cameraBindings.posX}
            onChange={(posX) =>
              saveConfig({
                cameraBindings: { ...config.cameraBindings, posX },
              })
            }
          />
          <BindingInput
            label="posY"
            value={config.cameraBindings.posY}
            onChange={(posY) =>
              saveConfig({
                cameraBindings: { ...config.cameraBindings, posY },
              })
            }
          />
          <BindingInput
            label="posZ"
            value={config.cameraBindings.posZ}
            onChange={(posZ) =>
              saveConfig({
                cameraBindings: { ...config.cameraBindings, posZ },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
