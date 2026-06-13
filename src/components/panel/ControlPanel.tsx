"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ACCENT,
  BG_COLOR,
  PANEL_BG_COLOR,
  PANEL_BORDER_COLOR,
} from "@/lib/constants";
import { ControllerTab } from "@/components/panel/ControllerTab";
import { InputsTab } from "@/components/panel/InputsTab";
import { LayersTab } from "@/components/panel/LayersTab";
import { VariablesTab } from "@/components/panel/VariablesTab";

export type PanelTab = "layers" | "variables" | "inputs" | "controller";

type ControlPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: "layers", label: "LAYERS" },
  { id: "variables", label: "VARIABLES" },
  { id: "controller", label: "CONTROLLER" },
  { id: "inputs", label: "INPUTS" },
];

const PANEL_WIDTH_PX = 420;
const PANEL_MAX_HEIGHT_PX = 480;
const HANDLE_HEIGHT_PX = 28;

export function ControlPanel({ open, onOpenChange }: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("layers");
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position.x, position.y],
  );

  const handleDragPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const panelHeight = panelRef.current?.offsetHeight ?? PANEL_MAX_HEIGHT_PX;
      const maxX = Math.max(0, window.innerWidth - PANEL_WIDTH_PX - 8);
      const maxY = Math.max(0, window.innerHeight - panelHeight - HANDLE_HEIGHT_PX - 8);

      setPosition({
        x: Math.max(8, Math.min(maxX, drag.originX + deltaX)),
        y: Math.max(8, Math.min(maxY, drag.originY + deltaY)),
      });
    },
    [],
  );

  const handleDragPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      dragState.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  useEffect(() => {
    const clampPosition = () => {
      const panelHeight = panelRef.current?.offsetHeight ?? PANEL_MAX_HEIGHT_PX;
      const maxX = Math.max(0, window.innerWidth - PANEL_WIDTH_PX - 8);
      const maxY = Math.max(0, window.innerHeight - panelHeight - HANDLE_HEIGHT_PX - 8);
      setPosition((current) => ({
        x: Math.max(8, Math.min(maxX, current.x)),
        y: Math.max(8, Math.min(maxY, current.y)),
      }));
    };

    window.addEventListener("resize", clampPosition);
    return () => window.removeEventListener("resize", clampPosition);
  }, [open]);

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left: position.x,
        bottom: position.y,
        width: PANEL_WIDTH_PX,
      }}
    >
      <button
        type="button"
        className="pointer-events-auto flex w-full items-center justify-center gap-1 rounded-t-md font-mono text-xs transition-opacity hover:opacity-90"
        style={{
          height: HANDLE_HEIGHT_PX,
          backgroundColor: ACCENT,
          color: BG_COLOR,
        }}
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-label={open ? "Close control panel" : "Open control panel"}
      >
        <span
          className="inline-block transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▲
        </span>
        <span className="text-[10px] font-semibold tracking-wider">PANEL</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="pointer-events-auto flex flex-col overflow-hidden rounded-t-md border border-b-0 font-mono text-xs text-white"
          style={{
            backgroundColor: PANEL_BG_COLOR,
            borderColor: PANEL_BORDER_COLOR,
            maxHeight: PANEL_MAX_HEIGHT_PX,
          }}
        >
          <div
            className="flex cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing"
            style={{ borderColor: PANEL_BORDER_COLOR }}
            onPointerDown={handleDragPointerDown}
            onPointerMove={handleDragPointerMove}
            onPointerUp={handleDragPointerUp}
            onPointerCancel={handleDragPointerUp}
          >
            <span className="text-[10px] tracking-widest text-white/50">DRAG</span>
            <span className="text-white/30">☰</span>
          </div>

          <div
            className="flex border-b"
            style={{ borderColor: PANEL_BORDER_COLOR }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="flex-1 px-2 py-2 text-[10px] tracking-wider transition-colors"
                  style={{
                    color: isActive ? ACCENT : "rgba(255,255,255,0.4)",
                    borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeTab === "layers" && <LayersTab />}
            {activeTab === "variables" && <VariablesTab />}
            {activeTab === "controller" && <ControllerTab />}
            {activeTab === "inputs" && <InputsTab />}
          </div>
        </div>
      ) : null}
    </div>
  );
}