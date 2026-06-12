"use client";

import { useState } from "react";
import { BG_COLOR } from "@/lib/constants";
import { normalizeRoomCode } from "@/lib/joinUrl";

type ConnectionScreenProps = {
  onJoin: (roomCode: string) => void;
  initialRoomCode?: string;
};

export function ConnectionScreen({
  onJoin,
  initialRoomCode = "",
}: ConnectionScreenProps) {
  const [roomCode, setRoomCode] = useState(
    normalizeRoomCode(initialRoomCode),
  );

  const handleJoin = () => {
    const code = normalizeRoomCode(roomCode);
    if (code) {
      onJoin(code);
    }
  };

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
        value={roomCode}
        onChange={(event) =>
          setRoomCode(normalizeRoomCode(event.target.value))
        }
        placeholder="room code"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={8}
        className="w-full max-w-xs border border-white/20 px-4 py-3 font-mono text-sm uppercase text-white outline-none"
        style={{ backgroundColor: BG_COLOR, borderRadius: 0 }}
      />

      <button
        type="button"
        onClick={handleJoin}
        className="cursor-pointer font-mono text-sm text-white"
      >
        JOIN
      </button>
    </div>
  );
}
