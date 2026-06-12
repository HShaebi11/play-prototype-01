"use client";

import { useEffect, useRef } from "react";
import { BG_COLOR, DOT_STAGGER_MS } from "@/lib/constants";

const WORDMARK_SIZE = "clamp(48px, 8vw, 96px)";
const WORDMARK_LETTER_SPACING = "0.3em";
const DOT_COUNT = 5;
const DOT_SIZE_PX = 8;
const DOT_BASE_OPACITY = 0.3;
const DOT_PULSE_DURATION_MS = 600;
const DEFAULT_AUTO_TRANSITION_MS = 2400;

type LoadingScreenProps = {
  /** Called once after the intro delay — parent drives clip-path transition to waiting. */
  onAutoTransition?: () => void;
  /** Delay before `onAutoTransition` fires. */
  autoTransitionMs?: number;
};

export function LoadingScreen({
  onAutoTransition,
  autoTransitionMs = DEFAULT_AUTO_TRANSITION_MS,
}: LoadingScreenProps) {
  const onAutoTransitionRef = useRef(onAutoTransition);
  onAutoTransitionRef.current = onAutoTransition;

  useEffect(() => {
    if (!onAutoTransition) {
      return;
    }

    const timer = window.setTimeout(() => {
      onAutoTransitionRef.current?.();
    }, autoTransitionMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onAutoTransition, autoTransitionMs]);

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center font-mono text-white"
      style={{ backgroundColor: BG_COLOR }}
    >
      <h1
        className="font-mono font-normal text-white"
        style={{
          fontSize: WORDMARK_SIZE,
          letterSpacing: WORDMARK_LETTER_SPACING,
        }}
      >
        PLAY
      </h1>

      <div
        className="mt-8 flex items-center gap-2"
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <span
            key={index}
            className="play-loading-dot rounded-full bg-white"
            style={{
              width: DOT_SIZE_PX,
              height: DOT_SIZE_PX,
              animationDelay: `${index * DOT_STAGGER_MS}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
