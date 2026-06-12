import { useEffect, useRef } from "react";

type AnimationFrameCallback = (delta: number, time: number) => void;

/**
 * Shared requestAnimationFrame loop. Callback receives delta (ms) and timestamp.
 * Pauses when `enabled` is false.
 */
export function useAnimationFrame(
  callback: AnimationFrameCallback,
  enabled = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frameId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      callbackRef.current(delta, time);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [enabled]);
}
