"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CanvasRenderer } from "@/components/canvas/CanvasRenderer";
import { ControlPanel } from "@/components/panel/ControlPanel";
import { LoadingScreen } from "@/components/output/LoadingScreen";
import { WaitingScreen } from "@/components/output/WaitingScreen";
import type { PlayMode } from "@/components/input/ModeSwitcher";
import { useGamepad } from "@/hooks/useGamepad";
import { useLayerStoreApi } from "@/hooks/useLayerStore";
import { usePeer } from "@/hooks/usePeer";
import {
  DEFAULT_VARIABLES,
  useVariableStoreApi,
} from "@/hooks/useVariableStore";
import {
  BG_COLOR,
  SCREEN_TRANSITION_EASING,
  SCREEN_TRANSITION_MS,
} from "@/lib/constants";
import { useMappingStore } from "@/lib/mappings";
import {
  DEFAULT_CONTROLLER_CONFIG,
  syncMappingsFromConfig,
  useControllerConfigStore,
} from "@/lib/controllerConfig";

type OutputScreen = "loading" | "waiting" | "active";

type OutputPageClientProps = {
  lanHost: string | null;
};

function ConnectionStatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full transition-colors"
      style={{
        backgroundColor: connected ? "#22c55e" : "rgba(255,255,255,0.3)",
      }}
      aria-label={connected ? "Phone connected" : "Waiting for phone"}
      title={connected ? "Phone connected" : "Waiting for phone"}
    />
  );
}

function GamepadStatusIcon({
  connected,
  gamepadId,
}: {
  connected: boolean;
  gamepadId: string | null;
}) {
  return (
    <div className="group relative">
      <span
        className="inline-flex text-base leading-none transition-opacity"
        style={{ opacity: connected ? 1 : 0.3 }}
        aria-label={connected ? "Gamepad connected" : "No gamepad connected"}
      >
        🎮
      </span>
      {connected && gamepadId ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-max max-w-xs -translate-x-1/2 rounded border border-white/20 bg-black/90 px-2 py-1 text-[10px] text-white/90 group-hover:block">
          {gamepadId}
        </span>
      ) : null}
    </div>
  );
}

export function OutputPageClient({ lanHost }: OutputPageClientProps) {
  const [screen, setScreen] = useState<OutputScreen>("loading");
  const [clipExpanded, setClipExpanded] = useState(true);
  const [mode, setMode] = useState<PlayMode>("geo");
  const [panelOpen, setPanelOpen] = useState(false);

  const { localPeerId, isConnected, lastMessage, send } = usePeer({
    mode: "host",
  });

  const controllerConfig = useControllerConfigStore((state) => state.config);

  const gamepadStatus = useGamepad({
    onModeChange: setMode,
    onPanelToggle: () => setPanelOpen((open) => !open),
  });

  const targetScreen = useMemo((): OutputScreen => {
    if (!localPeerId) {
      return "loading";
    }

    if (isConnected) {
      return "active";
    }

    return "waiting";
  }, [localPeerId, isConnected]);

  useEffect(() => {
    useVariableStoreApi.getState().initialise(DEFAULT_VARIABLES);
    useLayerStoreApi.getState().initialise();
    syncMappingsFromConfig(
      useControllerConfigStore.getState().config ?? DEFAULT_CONTROLLER_CONFIG,
    );
  }, []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    send({ type: "config", config: controllerConfig });
  }, [isConnected, controllerConfig, send]);

  useEffect(() => {
    if (!lastMessage) {
      return;
    }

    const getTarget = useMappingStore.getState().getTarget;
    const setVariable = useVariableStoreApi.getState().set;

    switch (lastMessage.type) {
      case "dial": {
        const target = getTarget({
          device: "phone",
          type: "dial",
          id: lastMessage.id,
        });
        if (target) {
          setVariable(target, lastMessage.value, "phone");
        }
        break;
      }
      case "slider": {
        const target = getTarget({
          device: "phone",
          type: "slider",
          id: lastMessage.id,
        });
        if (target) {
          setVariable(target, lastMessage.value, "phone");
        }
        break;
      }
      case "xy": {
        const targetX = getTarget({
          device: "phone",
          type: "xy",
          id: lastMessage.id,
          axis: "x",
        });
        const targetY = getTarget({
          device: "phone",
          type: "xy",
          id: lastMessage.id,
          axis: "y",
        });
        if (targetX) {
          setVariable(targetX, lastMessage.x, "phone");
        }
        if (targetY) {
          setVariable(targetY, lastMessage.y, "phone");
        }
        break;
      }
      case "mode":
        setMode(lastMessage.value);
        break;
    }
  }, [lastMessage]);

  const transitionTo = useCallback((next: OutputScreen) => {
    setClipExpanded(false);

    requestAnimationFrame(() => {
      setScreen(next);
      requestAnimationFrame(() => {
        setClipExpanded(true);
      });
    });
  }, []);

  useEffect(() => {
    if (screen !== targetScreen) {
      transitionTo(targetScreen);
    }
  }, [screen, targetScreen, transitionTo]);

  return (
    <main
      className="relative min-h-screen font-mono text-white"
      style={{ backgroundColor: BG_COLOR }}
      data-mode={mode}
      data-panel-open={panelOpen}
    >
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-end gap-3 px-4 py-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <ConnectionStatusDot connected={isConnected} />
          <GamepadStatusIcon
            connected={gamepadStatus.connected}
            gamepadId={gamepadStatus.gamepadId}
          />
        </div>
      </div>

      {screen === "active" ? (
        <ControlPanel open={panelOpen} onOpenChange={setPanelOpen} />
      ) : null}

      <div
        className="absolute inset-0"
        style={{
          clipPath: clipExpanded
            ? "circle(150% at 50% 50%)"
            : "circle(0% at 50% 50%)",
          transition: `clip-path ${SCREEN_TRANSITION_MS}ms ${SCREEN_TRANSITION_EASING}`,
        }}
      >
        {screen === "loading" && <LoadingScreen />}
        {screen === "waiting" && (
          <WaitingScreen roomCode={localPeerId} lanHost={lanHost} />
        )}
        {screen === "active" && <CanvasRenderer />}
      </div>
    </main>
  );
}
