import { useEffect, useRef, useState } from "react";
import {
  GAMEPAD_AXIS_COUNT,
  GAMEPAD_AXIS_LEFT_TRIGGER,
  GAMEPAD_AXIS_RIGHT_TRIGGER,
  GAMEPAD_BUTTON_A,
  GAMEPAD_BUTTON_B,
  GAMEPAD_BUTTON_LEFT_BUMPER,
  GAMEPAD_BUTTON_LEFT_TRIGGER,
  GAMEPAD_BUTTON_RIGHT_TRIGGER,
  GAMEPAD_BUTTON_START,
  GAMEPAD_BUTTON_X,
  GAMEPAD_DEADZONE,
  normalizeGamepadAxis,
  normalizeGamepadTrigger,
} from "@/lib/constants";
import { useMappingStore } from "@/lib/mappings";
import { useVariableStore } from "@/lib/variables";

export type GamepadStatus = {
  connected: boolean;
  gamepadId: string | null;
  activeAxes: number;
};

export type UseGamepadOptions = {
  onModeChange?: (mode: "geo" | "audio" | "colour") => void;
  onPanelToggle?: () => void;
};

const ANALOG_BUTTON_INDICES = [
  GAMEPAD_BUTTON_LEFT_BUMPER,
  GAMEPAD_BUTTON_LEFT_TRIGGER,
  GAMEPAD_BUTTON_RIGHT_TRIGGER,
] as const;

const MODE_BUTTONS: Array<{
  index: number;
  mode: "geo" | "audio" | "colour";
}> = [
  { index: GAMEPAD_BUTTON_A, mode: "geo" },
  { index: GAMEPAD_BUTTON_B, mode: "audio" },
  { index: GAMEPAD_BUTTON_X, mode: "colour" },
];

function findActiveGamepad(): Gamepad | null {
  const gamepads = navigator.getGamepads();

  for (let index = 0; index < gamepads.length; index += 1) {
    const gamepad = gamepads[index];
    if (gamepad?.connected) {
      return gamepad;
    }
  }

  return null;
}

function normalizeAxisValue(axisIndex: number, value: number): number {
  if (
    axisIndex === GAMEPAD_AXIS_LEFT_TRIGGER ||
    axisIndex === GAMEPAD_AXIS_RIGHT_TRIGGER
  ) {
    return normalizeGamepadTrigger(value);
  }

  return normalizeGamepadAxis(value);
}

export function useGamepad(options: UseGamepadOptions = {}): GamepadStatus {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [status, setStatus] = useState<GamepadStatus>({
    connected: false,
    gamepadId: null,
    activeAxes: 0,
  });

  const previousButtonsRef = useRef<boolean[]>([]);

  useEffect(() => {
    const handleConnected = (event: GamepadEvent) => {
      console.log(`Gamepad connected: ${event.gamepad.id}`);
    };

    const handleDisconnected = (event: GamepadEvent) => {
      console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    };

    window.addEventListener("gamepadconnected", handleConnected);
    window.addEventListener("gamepaddisconnected", handleDisconnected);

    let frameId = 0;

    const poll = () => {
      const gamepad = findActiveGamepad();

      if (!gamepad) {
        previousButtonsRef.current = [];
        setStatus((current) =>
          current.connected
            ? { connected: false, gamepadId: null, activeAxes: 0 }
            : current,
        );
        frameId = requestAnimationFrame(poll);
        return;
      }

      const getTarget = useMappingStore.getState().getTarget;
      const setVariable = useVariableStore.getState().set;

      let activeAxes = 0;

      for (let axisIndex = 0; axisIndex < GAMEPAD_AXIS_COUNT; axisIndex += 1) {
        const rawValue = gamepad.axes[axisIndex] ?? 0;

        if (Math.abs(rawValue) >= GAMEPAD_DEADZONE) {
          activeAxes += 1;
        }

        const target = getTarget({
          device: "gamepad",
          type: "axis",
          index: axisIndex,
        });

        if (target) {
          setVariable(
            target,
            normalizeAxisValue(axisIndex, rawValue),
            "gamepad",
          );
        }
      }

      for (const buttonIndex of ANALOG_BUTTON_INDICES) {
        const button = gamepad.buttons[buttonIndex];
        if (!button) {
          continue;
        }

        const target = getTarget({
          device: "gamepad",
          type: "button",
          index: buttonIndex,
        });

        if (target) {
          setVariable(target, normalizeGamepadTrigger(button.value), "gamepad");
        }
      }

      const previousButtons = previousButtonsRef.current;
      const nextPreviousButtons = [...previousButtons];

      for (const { index, mode } of MODE_BUTTONS) {
        const pressed = gamepad.buttons[index]?.pressed ?? false;
        const wasPressed = previousButtons[index] ?? false;

        if (pressed && !wasPressed) {
          optionsRef.current.onModeChange?.(mode);
        }

        nextPreviousButtons[index] = pressed;
      }

      const startPressed = gamepad.buttons[GAMEPAD_BUTTON_START]?.pressed ?? false;
      const startWasPressed = previousButtons[GAMEPAD_BUTTON_START] ?? false;

      if (startPressed && !startWasPressed) {
        optionsRef.current.onPanelToggle?.();
      }

      nextPreviousButtons[GAMEPAD_BUTTON_START] = startPressed;
      previousButtonsRef.current = nextPreviousButtons;

      setStatus((current) => {
        if (
          current.connected &&
          current.gamepadId === gamepad.id &&
          current.activeAxes === activeAxes
        ) {
          return current;
        }

        return {
          connected: true,
          gamepadId: gamepad.id,
          activeAxes,
        };
      });

      frameId = requestAnimationFrame(poll);
    };

    frameId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("gamepadconnected", handleConnected);
      window.removeEventListener("gamepaddisconnected", handleDisconnected);
    };
  }, []);

  return status;
}
