"use client";

import { useRef } from "react";
import type { P5LayerConfig, P5SketchType } from "@/lib/layers";
import { DEFAULT_SHADER_SOURCE } from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { ACCENT } from "@/lib/constants";

type P5LayerConfigPanelProps = {
  layerId: string;
};

const SKETCH_OPTIONS: P5SketchType[] = [
  "noise_field",
  "image_displace",
  "typography",
  "draw",
  "shader",
];

const BINDING_KEYS: Record<P5SketchType, string[]> = {
  noise_field: ["density", "speed", "hue", "trail"],
  image_displace: ["displace", "speed", "hue"],
  typography: ["warp", "size", "hue"],
  draw: ["size", "hue", "speed"],
  shader: ["speed", "hue", "scale"],
};

export function P5LayerConfigPanel({ layerId }: P5LayerConfigPanelProps) {
  const layer = useLayerStore((state) => state.getLayer(layerId));
  const updateLayerConfig = useLayerStore((state) => state.updateLayerConfig);
  const setP5ImageSrc = useLayerStore((state) => state.setP5ImageSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!layer || layer.type !== "p5") {
    return null;
  }

  const config = layer.config as P5LayerConfig;
  const bindingKeys = BINDING_KEYS[config.sketch];

  const updateBinding = (key: string, variableId: string) => {
    updateLayerConfig(layerId, {
      bindings: {
        ...config.bindings,
        [key]: variableId.trim() || key,
      },
    });
  };

  const handleSketchChange = (sketch: P5SketchType) => {
    const defaults = BINDING_KEYS[sketch].reduce<Record<string, string>>(
      (accumulator, key) => {
        accumulator[key] = config.bindings[key] ?? key;
        return accumulator;
      },
      {},
    );

    updateLayerConfig(layerId, {
      sketch,
      bindings: defaults,
      shaderSource:
        sketch === "shader"
          ? config.shaderSource ?? DEFAULT_SHADER_SOURCE
          : config.shaderSource,
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const src = URL.createObjectURL(file);
    setP5ImageSrc(layerId, src);
    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <label className="flex flex-col gap-1 text-[9px] text-white/60">
        Sketch type
        <select
          className="rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={config.sketch}
          onChange={(event) =>
            handleSketchChange(event.target.value as P5SketchType)
          }
        >
          {SKETCH_OPTIONS.map((sketch) => (
            <option key={sketch} value={sketch}>
              {sketch}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          BINDINGS
        </span>
        <div className="flex flex-col gap-1">
          {bindingKeys.map((key) => (
            <label
              key={key}
              className="flex items-center gap-1 text-[9px] text-white/60"
            >
              <span className="w-16 shrink-0">{key}</span>
              <input
                className="min-w-0 flex-1 rounded border bg-black/30 px-1 py-0.5 font-mono text-[9px] text-white outline-none"
                style={{ borderColor: "rgba(255,255,255,0.15)" }}
                value={config.bindings[key] ?? key}
                onChange={(event) => updateBinding(key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      {config.sketch === "image_displace" ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            className="rounded border px-2 py-1 text-[9px] text-white/80 hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            {config.imageSrc ? "Replace image" : "Upload image"}
          </button>
        </div>
      ) : null}

      {config.sketch === "typography" ? (
        <label className="flex flex-col gap-1 text-[9px] text-white/60">
          Text
          <input
            className="rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
            value={config.text ?? "PLAY"}
            onChange={(event) =>
              updateLayerConfig(layerId, { text: event.target.value })
            }
          />
        </label>
      ) : null}

      {config.sketch === "shader" ? (
        <label className="flex flex-col gap-1 text-[9px] text-white/60">
          GLSL
          <textarea
            className="min-h-[120px] resize-y rounded border bg-black/40 px-1.5 py-1 font-mono text-[9px] leading-relaxed text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.15)", caretColor: ACCENT }}
            value={config.shaderSource ?? DEFAULT_SHADER_SOURCE}
            onChange={(event) =>
              updateLayerConfig(layerId, { shaderSource: event.target.value })
            }
          />
        </label>
      ) : null}
    </div>
  );
}
