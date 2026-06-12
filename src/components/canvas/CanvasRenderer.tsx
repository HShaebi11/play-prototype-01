"use client";

import { useMemo } from "react";
import { useLayerStore } from "@/hooks/useLayerStore";
import type {
  Layer,
  MediaLayerConfig,
  P5LayerConfig,
  ThreeJSLayerConfig,
} from "@/lib/layers";
import { BG_COLOR } from "@/lib/constants";
import { MediaLayer } from "./MediaLayer";
import { P5Layer } from "./P5Layer";
import { ThreeLayer } from "./ThreeLayer";

function sortLayers(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

export function CanvasRenderer() {
  const layers = useLayerStore((state) => state.layers);
  const sortedLayers = useMemo(() => sortLayers(layers), [layers]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: BG_COLOR }}
    >
      {sortedLayers.map((layer) => {
        if (!layer.visible) {
          return null;
        }

        const isDrawLayer =
          layer.type === "p5" &&
          (layer.config as P5LayerConfig).sketch === "draw";

        return (
          <div
            key={layer.id}
            className="absolute inset-0"
            style={{
              zIndex: layer.zIndex,
              opacity: layer.opacity,
              pointerEvents: isDrawLayer ? "auto" : "none",
            }}
          >
            {layer.type === "threejs" && (
              <ThreeLayer
                layerId={layer.id}
                config={layer.config as ThreeJSLayerConfig}
              />
            )}
            {layer.type === "p5" && (
              <P5Layer
                layerId={layer.id}
                config={layer.config as P5LayerConfig}
              />
            )}
            {layer.type === "media" && (
              <MediaLayer
                layerId={layer.id}
                config={layer.config as MediaLayerConfig}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
