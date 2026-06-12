"use client";

import { useCallback, useMemo, useState } from "react";
import type { Layer, LayerType } from "@/lib/layers";
import { useLayerStore } from "@/hooks/useLayerStore";
import { LayerRow } from "@/components/panel/LayerRow";

const LAYER_TYPE_OPTIONS: Array<{ type: LayerType; label: string }> = [
  { type: "threejs", label: "Three.js Layer" },
  { type: "p5", label: "p5.js Layer" },
  { type: "media", label: "Media Layer" },
];

export function LayersTab() {
  const layers = useLayerStore((state) => state.layers);
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => b.zIndex - a.zIndex),
    [layers],
  );
  const addLayer = useLayerStore((state) => state.addLayer);
  const reorderLayers = useLayerStore((state) => state.reorderLayers);

  const [showAddPicker, setShowAddPicker] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((id: string) => {
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggingId || draggingId === targetId) {
        setDraggingId(null);
        setDragOverId(null);
        return;
      }

      const ids = sortedLayers.map((layer) => layer.id);
      const fromIndex = ids.indexOf(draggingId);
      const toIndex = ids.indexOf(targetId);

      if (fromIndex < 0 || toIndex < 0) {
        setDraggingId(null);
        setDragOverId(null);
        return;
      }

      const next = [...ids];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggingId);

      const bottomToTop = [...next].reverse();
      reorderLayers(bottomToTop);

      setDraggingId(null);
      setDragOverId(null);
    },
    [draggingId, sortedLayers, reorderLayers],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        {sortedLayers.map((layer: Layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isDragging={draggingId === layer.id}
            isDragOver={dragOverId === layer.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      <div className="relative mt-2">
        <button
          type="button"
          className="w-full rounded border px-3 py-2 text-[10px] tracking-wider text-white/70 transition-colors hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
          onClick={() => setShowAddPicker((visible) => !visible)}
        >
          + Add Layer
        </button>

        {showAddPicker ? (
          <div
            className="absolute bottom-full left-0 right-0 mb-1 rounded border bg-[#0a0a0a] p-1 shadow-lg"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            {LAYER_TYPE_OPTIONS.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                className="block w-full rounded px-2 py-1.5 text-left text-[10px] text-white/80 hover:bg-white/10"
                onClick={() => {
                  addLayer(type);
                  setShowAddPicker(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
