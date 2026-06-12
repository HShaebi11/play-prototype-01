"use client";

import { BG_COLOR } from "@/lib/constants";
import { JoinQrCode } from "@/components/output/JoinQrCode";

const ROOM_CODE_SIZE = "clamp(40px, 6vw, 72px)";
const PLACEHOLDER_ROOM_CODE = "A3F7";

type WaitingScreenProps = {
  roomCode?: string;
  lanHost?: string | null;
};

export function WaitingScreen({
  roomCode = PLACEHOLDER_ROOM_CODE,
  lanHost = null,
}: WaitingScreenProps) {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center font-mono text-white"
      style={{ backgroundColor: BG_COLOR }}
    >
      <p
        className="font-mono font-normal tracking-widest"
        style={{ fontSize: ROOM_CODE_SIZE }}
      >
        {roomCode}
      </p>
      <p className="mt-4 text-sm font-mono text-white/50">
        Scan QR or enter code on your phone
      </p>
      <JoinQrCode roomCode={roomCode} lanHost={lanHost} />
    </div>
  );
}
