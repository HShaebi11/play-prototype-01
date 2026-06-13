"use client";

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ControlLayout, ControllerControl } from "@/lib/controllerConfig";
import { ControllerLayoutRenderer } from "@/components/controller/ControllerLayoutRenderer";
import type { PlayMode } from "@/components/input/ModeSwitcher";
import { ACCENT, BG_COLOR } from "@/lib/constants";

const GRID = 0.05;

function snap(value: number): number {
  return Math.round(value / GRID) * GRID;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

type DragMode = "move" | "resize";

type ControllerLayoutEditorProps = {
  controls: ControllerControl[];
  values: Record<string, number>;
  activeMode: PlayMode;
  selectedControlId: string | null;
  onSelectControl: (controlId: string | null) => void;
  onLayoutChange: (
    controlId: string,
    layout: Partial<ControlLayout>,
  ) => void;
};

export function ControllerLayoutEditor({
  controls,
  values,
  activeMode,
  selectedControlId,
  onSelectControl,
  onLayoutChange,
}: ControllerLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    controlId: string;
    mode: DragMode;
    startX: number;
    startY: number;
    origin: ControlLayout;
  } | null>(null);

  const handleCanvasPointerDown = () => {
    onSelectControl(null);
  };

  const handleControlPointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      control: ControllerControl,
      mode: DragMode,
    ) => {
      event.stopPropagation();
      onSelectControl(control.id);
      dragRef.current = {
        controlId: control.id,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...control.layout },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onSelectControl],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dx = (event.clientX - drag.startX) / rect.width;
      const dy = (event.clientY - drag.startY) / rect.height;

      if (drag.mode === "move") {
        onLayoutChange(drag.controlId, {
          x: snap(clamp01(drag.origin.x + dx)),
          y: snap(clamp01(drag.origin.y + dy)),
        });
      } else {
        onLayoutChange(drag.controlId, {
          w: snap(clamp01(Math.max(0.05, drag.origin.w + dx))),
          h: snap(clamp01(Math.max(0.05, drag.origin.h + dy))),
        });
      }
    },
    [onLayoutChange],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const selectedControl = controls.find((c) => c.id === selectedControlId);

  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <div
        ref={canvasRef}
        className="relative aspect-[16/10] h-full max-h-full w-full max-w-5xl overflow-hidden rounded-lg border"
        style={{
          backgroundColor: BG_COLOR,
          borderColor: "rgba(255,255,255,0.15)",
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "5% 5%",
          }}
        />
        <p className="pointer-events-none absolute left-3 top-2 text-[9px] tracking-wider text-white/30">
          LANDSCAPE PREVIEW
        </p>

        {controls.map((control) => {
          const isSelected = selectedControlId === control.id;
          return (
            <div
              key={control.id}
              className="absolute touch-none"
              style={{
                left: `${control.layout.x * 100}%`,
                top: `${control.layout.y * 100}%`,
                width: `${control.layout.w * 100}%`,
                height: `${control.layout.h * 100}%`,
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <div
                className="relative h-full w-full cursor-move rounded border"
                style={{
                  borderColor: isSelected ? ACCENT : "rgba(255,255,255,0.1)",
                  backgroundColor: isSelected
                    ? "rgba(245,158,11,0.06)"
                    : "rgba(255,255,255,0.02)",
                }}
                onPointerDown={(event) =>
                  handleControlPointerDown(event, control, "move")
                }
              >
                <span className="pointer-events-none absolute left-1 top-1 text-[8px] uppercase tracking-wider text-white/40">
                  {control.type}
                </span>
                <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden p-2 opacity-60">
                  <ControllerLayoutRenderer
                    controls={[control]}
                    values={values}
                    activeMode={activeMode}
                    interactive={false}
                  />
                </div>
                {isSelected ? (
                  <div
                    className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-tl"
                    style={{ backgroundColor: ACCENT }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      handleControlPointerDown(event, control, "resize");
                    }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}

        {selectedControl ? (
          <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[8px] text-white/50">
            {Math.round(selectedControl.layout.x * 100)}%,{" "}
            {Math.round(selectedControl.layout.y * 100)}% ·{" "}
            {Math.round(selectedControl.layout.w * 100)}×
            {Math.round(selectedControl.layout.h * 100)}%
          </div>
        ) : null}
      </div>
    </div>
  );
}
