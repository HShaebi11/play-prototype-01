import type { ControllerConfig } from "@/lib/controllerConfig";
import type { PlayMode } from "@/components/input/ModeSwitcher";

export type PlayMessage =
  | { type: "dial"; id: string; value: number }
  | { type: "slider"; id: string; value: number }
  | { type: "xy"; id: string; x: number; y: number }
  | { type: "mode"; value: PlayMode };

export type ConfigMessage = {
  type: "config";
  config: ControllerConfig;
  variableDefaults: Record<string, number>;
};

export type PeerMessage = PlayMessage | ConfigMessage;
