"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionScreen } from "@/components/input/ConnectionScreen";
import { ControllerSurface } from "@/components/input/ControllerSurface";
import type { PlayMode } from "@/components/input/ModeSwitcher";
import { usePeer } from "@/hooks/usePeer";
import { ACCENT, BG_COLOR } from "@/lib/constants";
import { normalizeRoomCode, readRoomCodeFromSearchParams } from "@/lib/joinUrl";

type JoinedControllerProps = {
  peerId: string;
};

function JoinedController({ peerId }: JoinedControllerProps) {
  const { isConnected, send, error } = usePeer({ mode: "join", peerId });

  const handleDialChange = useCallback(
    (id: string, value: number) => {
      send({ type: "dial", id, value });
    },
    [send],
  );

  const handleXYChange = useCallback(
    (x: number, y: number) => {
      send({ type: "xy", x, y });
    },
    [send],
  );

  const handleModeChange = useCallback(
    (mode: PlayMode) => {
      send({ type: "mode", value: mode });
    },
    [send],
  );

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-8">
        <h1
          className="font-mono text-4xl text-white"
          style={{ letterSpacing: "0.3em" }}
        >
          PLAY
        </h1>

        <input
          type="text"
          value={peerId}
          readOnly
          className="w-full max-w-xs border border-white/20 px-4 py-3 font-mono text-sm uppercase text-white outline-none"
          style={{ backgroundColor: BG_COLOR, borderRadius: 0 }}
        />

        <span className="font-mono text-sm" style={{ color: ACCENT }}>
          connecting...
        </span>

        {error ? (
          <p className="max-w-xs text-center font-mono text-xs text-red-500">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <ControllerSurface
      onDialChange={handleDialChange}
      onXYChange={handleXYChange}
      onModeChange={handleModeChange}
    />
  );
}

function InputPageContent() {
  const searchParams = useSearchParams();
  const urlCode = readRoomCodeFromSearchParams(searchParams);
  const [joinPeerId, setJoinPeerId] = useState<string | null>(urlCode);

  const handleJoin = (roomCode: string) => {
    const code = normalizeRoomCode(roomCode);
    if (code) {
      setJoinPeerId(code);
    }
  };

  return (
    <main
      className="min-h-screen font-mono text-white"
      style={{ backgroundColor: BG_COLOR }}
    >
      {joinPeerId === null ? (
        <ConnectionScreen
          onJoin={handleJoin}
          initialRoomCode={urlCode ?? ""}
        />
      ) : (
        <JoinedController peerId={joinPeerId} />
      )}
    </main>
  );
}

export default function InputPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen items-center justify-center font-mono text-white/50"
          style={{ backgroundColor: BG_COLOR }}
        >
          Loading...
        </main>
      }
    >
      <InputPageContent />
    </Suspense>
  );
}
