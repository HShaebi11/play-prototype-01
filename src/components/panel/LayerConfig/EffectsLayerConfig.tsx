"use client";

import type { EffectPreset, EffectsLayerConfig } from "@/lib/layers";
import {
  defaultParamsForPreset,
  EFFECT_VALUE_SCALES,
  PRESET_PARAM_DEFS,
} from "@/lib/effectPresetParams";
import { useLayerStore } from "@/hooks/useLayerStore";
import { VariableSelect } from "@/components/panel/VariableSelect";
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
}> = [
  { key: "intensity", label: "Intensity" },
  { key: "speed", label: "Speed" },
  { key: "hue", label: "Hue" },
  { key: "mix", label: "Mix (wet/dry)" },
];

const DEFAULT_CUSTOM_SHADER = `
color.rgb = hueRotate(color.rgb, uHue);
color.rgb *= 0.9 + uIntensity * 0.2;
`.trim();

function ValueScaleSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);

  return (
    <label className="flex items-center gap-2 text-[9px] text-white/60">
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={200}
        step={1}
        value={percent}
        className="min-w-0 flex-1 accent-amber-500"
        onChange={(event) =>
          onChange(Number(event.target.value) / 100)
        }
      />
      <span className="w-10 shrink-0 text-right font-mono text-white/80">
        {percent}%
      </span>
    </label>
  );
}

function PresetParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[9px] text-white/60">
      <span className="w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="min-w-0 flex-1 accent-amber-500"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="w-10 shrink-0 text-right font-mono text-white/80">
        {value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
      </span>
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
  const presetParams = PRESET_PARAM_DEFS[config.preset] ?? [];

  const updateBinding = (
    key: keyof EffectsLayerConfig["bindings"],
    variableId: string | undefined,
  ) => {
    updateLayerConfig(layerId, {
      bindings: {
        ...config.bindings,
        [key]: variableId,
      },
    });
  };

  const updateValueScale = (
    key: keyof NonNullable<EffectsLayerConfig["values"]>,
    scale: number,
  ) => {
    updateLayerConfig(layerId, {
      values: {
        ...config.values,
        [key]: scale,
      },
    });
  };

  const updatePresetParam = (key: string, value: number) => {
    updateLayerConfig(layerId, {
      params: {
        ...config.params,
        [key]: value,
      },
    });
  };

  const handlePresetChange = (preset: EffectPreset) => {
    const nextParams = defaultParamsForPreset(preset);
    updateLayerConfig(layerId, {
      preset,
      params: Object.keys(nextParams).length > 0 ? nextParams : config.params,
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
            handlePresetChange(event.target.value as EffectPreset)
          }
        >
          {PRESET_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {presetParams.length > 0 ? (
        <div>
          <span className="mb-1 block text-[9px] tracking-wider text-white/50">
            PRESET VALUES
          </span>
          <div className="flex flex-col gap-1.5">
            {presetParams.map((param) => (
              <PresetParamSlider
                key={param.key}
                label={param.label}
                value={config.params?.[param.key] ?? param.defaultValue}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={(value) => updatePresetParam(param.key, value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          VALUE SCALES
        </span>
        <p className="mb-1.5 text-[8px] leading-relaxed text-white/40">
          Multiplies live variable bindings (phone / gamepad).
        </p>
        <div className="flex flex-col gap-1.5">
          {EFFECT_VALUE_SCALES.map(({ key, label, defaultScale }) => (
            <ValueScaleSlider
              key={key}
              label={label}
              value={config.values?.[key] ?? defaultScale}
              onChange={(scale) => updateValueScale(key, scale)}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          BINDINGS
        </span>
        <div className="flex flex-col gap-1">
          {BINDING_FIELDS.map(({ key, label }) => (
            <VariableSelect
              key={key}
              label={label}
              value={config.bindings[key]}
              onChange={(variableId) => updateBinding(key, variableId)}
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
