"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { BG_COLOR } from "@/lib/constants";
import {
  buildJoinUrlFromOrigin,
  buildLanJoinUrl,
  normalizeRoomCode,
} from "@/lib/joinUrl";

type JoinQrCodeProps = {
  roomCode: string;
};

type LanHostResponse = {
  host: string | null;
};

export function JoinQrCode({ roomCode }: JoinQrCodeProps) {
  const [lanHost, setLanHost] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const code = normalizeRoomCode(roomCode);

  useEffect(() => {
    let cancelled = false;

    const loadLanHost = async () => {
      try {
        const response = await fetch("/api/lan-host");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as LanHostResponse;
        if (!cancelled && data.host) {
          setLanHost(data.host);
        }
      } catch {
        // LAN host is optional — fall back to current hostname.
      }
    };

    loadLanHost();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const { protocol, port, hostname, origin } = window.location;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalhost && lanHost) {
      setJoinUrl(buildLanJoinUrl(protocol, lanHost, port, code));
      return;
    }

    if (isLocalhost) {
      setJoinUrl(buildLanJoinUrl(protocol, hostname, port, code));
      return;
    }

    // Vercel, LAN hostname, or any public origin — use full origin (https on prod).
    setJoinUrl(buildJoinUrlFromOrigin(origin, code));
  }, [code, lanHost]);

  const handleCopy = async () => {
    if (!joinUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be denied on some mobile browsers.
    }
  };

  if (!joinUrl) {
    return null;
  }

  const showsLocalhostWarning =
    joinUrl.includes("localhost") || joinUrl.includes("127.0.0.1");

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "#ffffff" }}
        aria-label="Scan to join on your phone"
      >
        <QRCode
          value={joinUrl}
          size={160}
          level="M"
          bgColor="#ffffff"
          fgColor={BG_COLOR}
        />
      </div>

      <p className="max-w-xs text-center text-xs text-white/50">
        Scan with your phone camera, or open the link below
      </p>

      <button
        type="button"
        onClick={handleCopy}
        className="max-w-xs truncate px-2 text-center font-mono text-[10px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
      >
        {copied ? "Copied!" : joinUrl}
      </button>

      {showsLocalhostWarning ? (
        <p className="max-w-xs text-center text-[10px] text-amber-400/80">
          Could not detect your LAN IP. Open /output using your computer&apos;s
          network address (e.g. 192.168.0.183:3000/output) so the QR code works
          on your phone.
        </p>
      ) : null}
    </div>
  );
}
