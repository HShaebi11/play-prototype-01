import type { EffectPreset } from "@/lib/layers";

export type EffectPresetParamDef = {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
};

export const EFFECT_VALUE_SCALES: Array<{
  key: "intensity" | "speed" | "hue" | "mix";
  label: string;
  defaultScale: number;
}> = [
  { key: "intensity", label: "Intensity scale", defaultScale: 1 },
  { key: "speed", label: "Speed scale", defaultScale: 1 },
  { key: "hue", label: "Hue scale", defaultScale: 1 },
  { key: "mix", label: "Mix scale", defaultScale: 1 },
];

export const PRESET_PARAM_DEFS: Partial<
  Record<EffectPreset, EffectPresetParamDef[]>
> = {
  cinema: [
    {
      key: "vignette",
      label: "Vignette",
      defaultValue: 0.7,
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      key: "grain",
      label: "Grain",
      defaultValue: 0.15,
      min: 0,
      max: 0.5,
      step: 0.01,
    },
    {
      key: "grade",
      label: "Grade",
      defaultValue: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  glitch: [
    {
      key: "displacement",
      label: "Displacement",
      defaultValue: 0.08,
      min: 0,
      max: 0.2,
      step: 0.005,
    },
    {
      key: "blocks",
      label: "Block density",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
  rgb_split: [
    {
      key: "offset",
      label: "Chromatic offset",
      defaultValue: 0.015,
      min: 0,
      max: 0.06,
      step: 0.001,
    },
  ],
  dream: [
    {
      key: "blur",
      label: "Blur radius",
      defaultValue: 2,
      min: 0,
      max: 6,
      step: 0.1,
    },
    {
      key: "vignette",
      label: "Vignette",
      defaultValue: 0.6,
      min: 0,
      max: 1,
      step: 0.01,
    },
  ],
};

export function getPresetParamValue(
  preset: EffectPreset,
  params: Record<string, number> | undefined,
  key: string,
): number {
  const defs = PRESET_PARAM_DEFS[preset];
  const def = defs?.find((entry) => entry.key === key);
  if (!def) {
    return 0;
  }
  return params?.[key] ?? def.defaultValue;
}

export function getPresetUniformParams(
  preset: EffectPreset,
  params: Record<string, number> | undefined,
): { uParam1: number; uParam2: number; uParam3: number } {
  switch (preset) {
    case "cinema":
      return {
        uParam1: getPresetParamValue(preset, params, "vignette"),
        uParam2: getPresetParamValue(preset, params, "grain"),
        uParam3: getPresetParamValue(preset, params, "grade"),
      };
    case "glitch":
      return {
        uParam1: getPresetParamValue(preset, params, "displacement"),
        uParam2: getPresetParamValue(preset, params, "blocks"),
        uParam3: 0,
      };
    case "rgb_split":
      return {
        uParam1: getPresetParamValue(preset, params, "offset"),
        uParam2: 0,
        uParam3: 0,
      };
    case "dream":
      return {
        uParam1: getPresetParamValue(preset, params, "blur"),
        uParam2: getPresetParamValue(preset, params, "vignette"),
        uParam3: 0,
      };
    default:
      return { uParam1: 1, uParam2: 1, uParam3: 1 };
  }
}

export function defaultParamsForPreset(
  preset: EffectPreset,
): Record<string, number> {
  const defs = PRESET_PARAM_DEFS[preset];
  if (!defs) {
    return {};
  }

  return Object.fromEntries(
    defs.map((def) => [def.key, def.defaultValue]),
  );
}
