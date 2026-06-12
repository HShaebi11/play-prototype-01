"use client";

import { useCallback, useState } from "react";
import type { Layer } from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { ACCENT, PANEL_SELECTED_TINT } from "@/lib/constants";
import { MediaLayerConfigPanel } from "@/components/panel/LayerConfig/MediaLayerConfig";
import { EffectsLayerConfigPanel } from "@/components/panel/LayerConfig/EffectsLayerConfig";
import { P5LayerConfigPanel } from "@/components/panel/LayerConfig/P5LayerConfig";
import { ThreeLayerConfigPanel } from "@/components/panel/LayerConfig/ThreeLayerConfig";

type LayerRowProps = {
  layer: Layer;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
};

function typeBadgeStyle(type: Layer["type"]): { label: string; color: string } {
  switch (type) {
    case "threejs":
      return { label: "THREE", color: ACCENT };
    case "p5":
      return { label: "P5", color: "rgba(255,255,255,0.9)" };
    case "media":
      return { label: "MEDIA", color: "rgba(255,255,255,0.9)" };
    case "effects":
      return { label: "FX", color: "#a78bfa" };
  }
}

export function LayerRow({
  layer,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: LayerRowProps) {
  const setLayerVisibility = useLayerStore((state) => state.setLayerVisibility);
  const setLayerOpacity = useLayerStore((state) => state.setLayerOpacity);
  const setLayerName = useLayerStore((state) => state.setLayerName);
  const removeLayer = useLayerStore((state) => state.removeLayer);

  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(layer.name);

  const badge = typeBadgeStyle(layer.type);

  const commitName = useCallback(() => {
    const trimmed = nameDraft.trim();
    if (trimmed) {
      setLayerName(layer.id, trimmed);
    } else {
      setNameDraft(layer.name);
    }
    setEditingName(false);
  }, [layer.id, layer.name, nameDraft, setLayerName]);

  return (
    <div
      className="rounded border transition-colors"
      style={{
        borderColor: isDragOver ? ACCENT : "rgba(255,255,255,0.1)",
        backgroundColor: isDragOver ? PANEL_SELECTED_TINT : "transparent",
        opacity: isDragging ? 0.5 : 1,
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(layer.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(layer.id);
      }}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/5"
        style={{ cursor: "default" }}
      >
        <span
          draggable
          className="cursor-grab select-none text-white/40 hover:text-white/70 active:cursor-grabbing"
          onDragStart={() => onDragStart(layer.id)}
          onDragEnd={onDragEnd}
          aria-label="Drag to reorder"
        >
          ☰
        </span>

        <span
          className="rounded px-1 py-0.5 text-[8px] font-semibold tracking-wide"
          style={{
            color: badge.color,
            border: `1px solid ${badge.color}`,
          }}
        >
          {badge.label}
        </span>

        {editingName ? (
          <input
            className="min-w-0 flex-1 rounded bg-black/40 px-1 py-0.5 text-[10px] text-white outline-none"
            value={nameDraft}
            autoFocus
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitName();
              }
              if (event.key === "Escape") {
                setNameDraft(layer.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-[10px] text-white/90"
            onDoubleClick={() => {
              setNameDraft(layer.name);
              setEditingName(true);
            }}
            onClick={() => setExpanded((value) => !value)}
          >
            {layer.name}
          </button>
        )}

        <button
          type="button"
          className="px-1 text-sm leading-none text-white/50 hover:text-white"
          onClick={() => setLayerVisibility(layer.id, !layer.visible)}
          aria-label={layer.visible ? "Hide layer" : "Show layer"}
        >
          {layer.visible ? "👁" : "👁‍🗨"}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(layer.opacity * 100)}
          className="h-1 w-12 accent-amber-500"
          onChange={(event) =>
            setLayerOpacity(layer.id, Number(event.target.value) / 100)
          }
          aria-label="Layer opacity"
        />

        <button
          type="button"
          className="px-1 text-sm leading-none text-white/40 hover:text-red-400"
          onClick={() => removeLayer(layer.id)}
          aria-label="Delete layer"
        >
          ×
        </button>
      </div>

      {expanded ? (
        <div
          className="border-t px-2 py-2"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {layer.type === "threejs" ? (
            <ThreeLayerConfigPanel layerId={layer.id} />
          ) : null}
          {layer.type === "p5" ? <P5LayerConfigPanel layerId={layer.id} /> : null}
          {layer.type === "media" ? (
            <MediaLayerConfigPanel layerId={layer.id} />
          ) : null}
          {layer.type === "effects" ? (
            <EffectsLayerConfigPanel layerId={layer.id} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
