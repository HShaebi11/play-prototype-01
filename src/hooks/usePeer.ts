"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Peer, {
  type DataConnection,
  PeerError,
  PeerErrorType,
  SerializationType,
} from "peerjs";
import { normalizeRoomCode } from "@/lib/joinUrl";
import type { PlayMessage } from "@/lib/types";

const PEER_ID_LENGTH = 4;
/** Uppercase only — easier to type on phone and matches QR / URL normalisation. */
const PEER_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const CONNECT_OPTIONS = {
  reliable: true,
  serialization: SerializationType.JSON,
};

export type UsePeerMode = "host" | "join";

export type UsePeerArgs = {
  mode: UsePeerMode;
  peerId?: string;
};

export type UsePeerResult = {
  localPeerId: string;
  isConnected: boolean;
  send: (msg: PlayMessage) => void;
  lastMessage: PlayMessage | null;
  error: string | null;
};

function generatePeerId(): string {
  let id = "";
  for (let i = 0; i < PEER_ID_LENGTH; i++) {
    id += PEER_ID_ALPHABET[Math.floor(Math.random() * PEER_ID_ALPHABET.length)];
  }
  return id;
}

function isPlayMessage(data: unknown): data is PlayMessage {
  if (!data || typeof data !== "object") {
    return false;
  }

  const msg = data as Record<string, unknown>;

  switch (msg.type) {
    case "dial":
    case "slider":
      return typeof msg.id === "string" && typeof msg.value === "number";
    case "xy":
      return typeof msg.x === "number" && typeof msg.y === "number";
    case "mode":
      return (
        msg.value === "geo" ||
        msg.value === "audio" ||
        msg.value === "colour"
      );
    default:
      return false;
  }
}

function parsePlayMessage(data: unknown): PlayMessage | null {
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      return isPlayMessage(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isPlayMessage(data) ? data : null;
}

function describePeerError(error: PeerError<string>): string {
  const raw = error.message || error.type;

  if (
    raw.toLowerCase().includes("could not connect") ||
    error.type === PeerErrorType.Network
  ) {
    return "Could not reach the room. Check the code, keep /output open on your laptop, and use the same WiFi.";
  }

  if (error.type === PeerErrorType.PeerUnavailable) {
    return "Room not found. Open /output on your laptop first, then scan the QR code or re-enter the code.";
  }

  return raw;
}

export function usePeer({ mode, peerId }: UsePeerArgs): UsePeerResult {
  const [localPeerId, setLocalPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<PlayMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<DataConnection | null>(null);

  const send = useCallback((msg: PlayMessage) => {
    const connection = connectionRef.current;

    if (!connection?.open) {
      console.warn("[usePeer] send() called before connection is open");
      return;
    }

    connection.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    let disposed = false;
    let peer: Peer | null = null;

    const closeConnection = () => {
      const connection = connectionRef.current;
      if (!connection) {
        return;
      }

      connectionRef.current = null;
      connection.close();
      if (!disposed) {
        setIsConnected(false);
      }
    };

    const destroyPeer = () => {
      closeConnection();

      if (!peer) {
        return;
      }

      peer.destroy();
      peer = null;
    };

    const attachConnection = (connection: DataConnection) => {
      connectionRef.current = connection;

      connection.on("open", () => {
        if (disposed) {
          return;
        }
        setIsConnected(true);
        setError(null);
      });

      connection.on("data", (data: unknown) => {
        if (disposed) {
          return;
        }

        const message = parsePlayMessage(data);
        if (message) {
          setLastMessage(message);
        } else {
          console.warn("[usePeer] Received invalid PlayMessage payload", data);
        }
      });

      connection.on("close", () => {
        if (disposed) {
          return;
        }
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
        setIsConnected(false);
      });

      connection.on("error", (connError: PeerError<string>) => {
        if (disposed) {
          return;
        }
        const message = describePeerError(connError);
        console.error("[usePeer] DataConnection error:", message);
        setError(message);
      });
    };

    const handlePeerError = (peerError: PeerError<string>) => {
      if (disposed) {
        return;
      }

      if (mode === "host" && peerError.type === PeerErrorType.UnavailableID) {
        const takenId = peer?.id ?? "unknown";
        console.warn(
          `[usePeer] Peer ID "${takenId}" unavailable, retrying with a new ID`,
        );
        destroyPeer();
        startHostPeer();
        return;
      }

      const message = describePeerError(peerError);
      console.error("[usePeer] Peer error:", message);
      setError(message);
    };

    const startHostPeer = () => {
      if (disposed) {
        return;
      }

      const id = generatePeerId();
      peer = new Peer(id);

      peer.on("open", (openedId: string) => {
        if (disposed) {
          return;
        }
        setLocalPeerId(openedId);
        setError(null);
      });

      peer.on("connection", (connection: DataConnection) => {
        if (disposed) {
          connection.close();
          return;
        }

        closeConnection();
        attachConnection(connection);
      });

      peer.on("error", handlePeerError);
    };

    const startJoinPeer = (remotePeerId: string) => {
      if (disposed) {
        return;
      }

      peer = new Peer();

      peer.on("open", () => {
        if (disposed || !peer) {
          return;
        }

        setLocalPeerId(peer.id);
        setError(null);

        const connection = peer.connect(remotePeerId, CONNECT_OPTIONS);
        attachConnection(connection);
      });

      peer.on("error", handlePeerError);
    };

    setLocalPeerId("");
    setIsConnected(false);
    setLastMessage(null);
    setError(null);
    connectionRef.current = null;

    if (mode === "host") {
      startHostPeer();
    } else {
      const remotePeerId = normalizeRoomCode(peerId ?? "");

      if (!remotePeerId) {
        setError("Room code is required");
      } else {
        startJoinPeer(remotePeerId);
      }
    }

    return () => {
      disposed = true;
      destroyPeer();
      connectionRef.current = null;
    };
  }, [mode, peerId]);

  return {
    localPeerId,
    isConnected,
    send,
    lastMessage,
    error,
  };
}
