"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";
import { useLayerStore } from "@/hooks/useLayerStore";
import type {
  EffectsLayerConfig,
  Layer,
  MediaLayerConfig,
  P5LayerConfig,
  ThreeJSLayerConfig,
} from "@/lib/layers";
import { BG_COLOR } from "@/lib/constants";
import { MediaLayer } from "./MediaLayer";
import { P5Layer } from "./P5Layer";

const ThreeLayer = dynamic(
  () => import("./ThreeLayer").then((mod) => mod.ThreeLayer),
  { ssr: false },
);

const EffectsLayer = dynamic(
  () => import("./EffectsLayer").then((mod) => mod.EffectsLayer),
  { ssr: false },
);

function sortLayers(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

export function CanvasRenderer() {
  const layers = useLayerStore((state) => state.layers);
  const contentRef = useRef<HTMLDivElement>(null);

  const contentLayers = useMemo(
    () => sortLayers(layers).filter((layer) => layer.type !== "effects"),
    [layers],
  );

  const effectsLayer = useMemo(
    () =>
      sortLayers(layers).find(
        (layer) => layer.type === "effects" && layer.visible,
      ),
    [layers],
  );

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{ backgroundColor: BG_COLOR }}
    >
      <div ref={contentRef} className="absolute inset-0">
        {contentLayers.map((layer) => {
          if (!layer.visible) {
            return null;
          }

          const isDrawLayer =
            layer.type === "p5" &&
            (layer.config as P5LayerConfig).sketch === "draw";

          return (
            <div
              key={layer.id}
              data-layer-surface
              data-layer-type={layer.type}
              data-layer-visible={String(layer.visible)}
              data-layer-opacity={String(layer.opacity)}
              data-layer-z-index={String(layer.zIndex)}
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

      {effectsLayer ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 10000 }}
        >
          <EffectsLayer
            sourceRef={contentRef}
            config={effectsLayer.config as EffectsLayerConfig}
            opacity={effectsLayer.opacity}
          />
        </div>
      ) : null}
    </div>
  );
}
