"use client";

import { useRef } from "react";
import type { MediaFit, MediaLayerConfig } from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { VariableSelect } from "@/components/panel/VariableSelect";

type MediaLayerConfigPanelProps = {
  layerId: string;
};

const FIT_OPTIONS: MediaFit[] = ["cover", "contain", "fill", "tile"];

const BINDING_FIELDS: Array<{
  key: keyof MediaLayerConfig["bindings"];
  label: string;
}> = [
  { key: "opacity", label: "opacity" },
  { key: "scaleX", label: "scaleX" },
  { key: "scaleY", label: "scaleY" },
  { key: "posX", label: "posX" },
  { key: "posY", label: "posY" },
  { key: "hue", label: "hue" },
  { key: "brightness", label: "brightness" },
  { key: "blur", label: "blur" },
  { key: "speed", label: "speed" },
  { key: "scrub", label: "scrub" },
];

export function MediaLayerConfigPanel({ layerId }: MediaLayerConfigPanelProps) {
  const layer = useLayerStore((state) => state.getLayer(layerId));
  const updateLayerConfig = useLayerStore((state) => state.updateLayerConfig);
  const setMediaSrc = useLayerStore((state) => state.setMediaSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!layer || layer.type !== "media") {
    return null;
  }

  const config = layer.config as MediaLayerConfig;

  const updateBinding = (
    key: keyof MediaLayerConfig["bindings"],
    variableId: string | undefined,
  ) => {
    updateLayerConfig(layerId, {
      bindings: {
        ...config.bindings,
        [key]: variableId,
      },
    });
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const src = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    setMediaSrc(layerId, src, mediaType);
    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3 text-[10px]">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          className="rounded border px-2 py-1 text-[9px] text-white/80 hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          onClick={() => fileInputRef.current?.click()}
        >
          {config.src ? "Replace media" : "Upload media"}
        </button>
        {config.src ? (
          <span className="ml-2 text-[8px] text-white/40">
            {config.mediaType}
          </span>
        ) : null}
      </div>

      <label className="flex flex-col gap-1 text-[9px] text-white/60">
        Fit mode
        <select
          className="rounded border bg-black/40 px-1 py-0.5 text-[9px] text-white outline-none"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          value={config.fit}
          onChange={(event) =>
            updateLayerConfig(layerId, {
              fit: event.target.value as MediaFit,
            })
          }
        >
          {FIT_OPTIONS.map((fit) => (
            <option key={fit} value={fit}>
              {fit}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="mb-1 block text-[9px] tracking-wider text-white/50">
          BINDINGS
        </span>
        <div className="flex flex-col gap-1">
          {BINDING_FIELDS.map(({ key, label }) => (
            <VariableSelect
              key={key}
              label={label}
              labelWidth="w-16"
              value={config.bindings[key]}
              onChange={(variableId) => updateBinding(key, variableId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
