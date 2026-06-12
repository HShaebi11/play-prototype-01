"use client";

import { useCallback, useRef } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useLayerStoreApi } from "@/hooks/useLayerStore";
import { useVariableStoreApi } from "@/hooks/useVariableStore";
import type { MediaFit, MediaLayerConfig } from "@/lib/layers";

type MediaLayerProps = {
  layerId: string;
  config: MediaLayerConfig;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function fitStyles(fit: MediaFit): React.CSSProperties {
  switch (fit) {
    case "cover":
      return {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      };
    case "contain":
      return {
        width: "100%",
        height: "100%",
        objectFit: "contain",
      };
    case "fill":
      return {
        width: "100%",
        height: "100%",
        objectFit: "fill",
      };
    case "tile":
      return {
        width: "auto",
        height: "auto",
        minWidth: "100%",
        minHeight: "100%",
        objectFit: "none",
        objectPosition: "top left",
      };
  }
}

export function MediaLayer({ layerId, config }: MediaLayerProps) {
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrubRef = useRef<number | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const src = URL.createObjectURL(file);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      useLayerStoreApi.getState().setMediaSrc(layerId, src, mediaType);
      event.target.value = "";
    },
    [layerId],
  );

  useAnimationFrame(() => {
    const element = mediaRef.current;
    if (!element || !config.src) {
      return;
    }

    const get = useVariableStoreApi.getState().get;
    const bindings = config.bindings;

    const scaleX = bindings.scaleX ? get(bindings.scaleX) : 0.5;
    const scaleY = bindings.scaleY ? get(bindings.scaleY) : 0.5;
    const posX = bindings.posX ? get(bindings.posX) : 0.5;
    const posY = bindings.posY ? get(bindings.posY) : 0.5;
    const opacity = bindings.opacity ? get(bindings.opacity) : 1;
    const hue = bindings.hue ? get(bindings.hue) : 0;
    const brightness = bindings.brightness ? get(bindings.brightness) : 0.5;
    const blur = bindings.blur ? get(bindings.blur) : 0;

    const scaleXValue = 0.5 + scaleX * 1.5;
    const scaleYValue = 0.5 + scaleY * 1.5;
    const translateX = (posX - 0.5) * 40;
    const translateY = (posY - 0.5) * 40;

    element.style.opacity = String(clamp01(opacity));
    element.style.transform = `translate(${translateX}%, ${translateY}%) scale(${scaleXValue}, ${scaleYValue})`;
    element.style.filter = `hue-rotate(${hue * 360}deg) brightness(${0.5 + brightness * 1.5}) blur(${blur * 20}px)`;

    if (element instanceof HTMLVideoElement) {
      const speedBinding = bindings.speed;
      const scrubBinding = bindings.scrub;

      if (scrubBinding) {
        const scrubValue = get(scrubBinding);
        if (lastScrubRef.current !== scrubValue) {
          lastScrubRef.current = scrubValue;
          if (element.duration && Number.isFinite(element.duration)) {
            element.pause();
            element.currentTime = scrubValue * element.duration;
          }
        }
      } else {
        lastScrubRef.current = null;
        const speedValue = speedBinding ? get(speedBinding) : 0.33;
        element.playbackRate = speedValue * 3;
        if (element.paused) {
          element.play().catch(() => undefined);
        }
      }
    }
  });

  if (!config.src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-40 w-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/30 bg-black/40 px-4 text-center text-xs text-white/60 transition-colors hover:border-white/50 hover:text-white/80"
        >
          Drop a file or click to upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  const mediaStyle: React.CSSProperties = {
    ...fitStyles(config.fit),
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    transformOrigin: "center center",
  };

  if (config.mediaType === "video") {
    return (
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={config.src}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0"
        style={mediaStyle}
      />
    );
  }

  return (
    <img
      ref={mediaRef as React.RefObject<HTMLImageElement>}
      src={config.src}
      alt=""
      className="absolute inset-0"
      style={mediaStyle}
    />
  );
}
