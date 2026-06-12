"use client";

import type { EffectPreset, EffectsLayerConfig } from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { ACCENT } from "@/lib/constants";

type EffectsLayerConfigPanelProps = {
  layerId: string;
};

const PRESET_OPTIONS: Array<{ value: EffectPreset; label: string }> = [
  { value: "off", label: "Off" },
  { value: "cinema", label: "Cinema" },
  { value: "glitch", label: "Glitch" },
  { value: "rgb_split", label: "RGB Split" },
  { value: "dream", label: "Dream" },
  { value: "custom", label: "Custom" },
];

const BINDING_FIELDS: Array<{
  key: keyof EffectsLayerConfig["bindings"];
  label: string;
  defaultVariable: string;
}> = [
  { key: "intensity", label: "Intensity", defaultVariable: "density" },
  { key: "speed", label: "Speed", defaultVariable: "speed" },
  { key: "hue", label: "Hue", defaultVariable: "hue" },
  { key: "mix", label: "Mix (wet/dry)", defaultVariable: "trail" },
];

const DEFAULT_CUSTOM_SHADER = `
color.rgb = hueRotate(color.rgb, uHue);
color.rgb *= 0.9 + uIntensity * 0.2;
`.trim();

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
      <span className="w-24 shrink-0">{label}</span>
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

export function EffectsLayerConfigPanel({
  layerId,
}: EffectsLayerConfigPanelProps) {
  const layer = useLayerStore((state) => state.getLayer(layerId));
  const updateLayerConfig = useLayerStore((state) => state.updateLayerConfig);

  if (!layer || layer.type !== "effects") {
    return null;
  }

  const config = layer.config as EffectsLayerConfig;

  const updateBinding = (
    key: keyof EffectsLayerConfig["bindings"],
    variableId: string | undefined,
    defaultVariable: string,
  ) => {
    updateLayerConfig(layerId, {
      bindings: {
        ...config.bindings,
        [key]: variableId ?? defaultVariable,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <label className="flex flex-col gap-1 text-[9px] text-white/60">
        Preset
        <select
          className="rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={config.preset}
          onChange={(event) =>
            updateLayerConfig(layerId, {
              preset: event.target.value as EffectPreset,
            })
          }
        >
          {PRESET_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          BINDINGS
        </span>
        <div className="flex flex-col gap-1">
          {BINDING_FIELDS.map(({ key, label, defaultVariable }) => (
            <BindingInput
              key={key}
              label={label}
              value={config.bindings[key] ?? defaultVariable}
              onChange={(variableId) =>
                updateBinding(key, variableId, defaultVariable)
              }
            />
          ))}
        </div>
      </div>

      {config.preset === "custom" ? (
        <label className="flex flex-col gap-1 text-[9px] text-white/60">
          GLSL (fragment body)
          <textarea
            className="min-h-[120px] resize-y rounded border bg-black/40 px-1.5 py-1 font-mono text-[9px] leading-relaxed text-white outline-none"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              caretColor: ACCENT,
            }}
            value={config.shaderSource ?? DEFAULT_CUSTOM_SHADER}
            onChange={(event) =>
              updateLayerConfig(layerId, { shaderSource: event.target.value })
            }
          />
        </label>
      ) : null}
    </div>
  );
}
