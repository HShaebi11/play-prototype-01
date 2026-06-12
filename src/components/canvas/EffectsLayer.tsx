"use client";

import { Canvas } from "@react-three/fiber/legacy";
import type { RefObject } from "react";
import type { EffectsLayerConfig } from "@/lib/layers";
import { EffectPipeline } from "./EffectPipeline";

type EffectsLayerProps = {
  sourceRef: RefObject<HTMLElement | null>;
  config: EffectsLayerConfig;
  opacity: number;
};

export function EffectsLayer({
  sourceRef,
  config,
  opacity,
}: EffectsLayerProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: false, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.autoClear = false;
      }}
    >
      <EffectPipeline
        sourceRef={sourceRef}
        config={config}
        opacity={opacity}
      />
    </Canvas>
  );
}
