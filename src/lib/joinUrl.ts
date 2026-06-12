/** Query param used on /input for auto-join (also accept legacy `room`). */
export const JOIN_CODE_PARAM = "code";

const LEGACY_ROOM_PARAM = "room";

/** Normalise room codes so typing and QR scans match PeerJS host IDs. */
export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/** Build join URL from the current page origin (works on Vercel HTTPS and LAN). */
export function buildJoinUrlFromOrigin(origin: string, roomCode: string): string {
  const code = normalizeRoomCode(roomCode);
  const base = origin.replace(/\/$/, "");
  return `${base}/input?${JOIN_CODE_PARAM}=${encodeURIComponent(code)}`;
}

/** Build join URL for local dev when laptop uses localhost but phone needs LAN IP. */
export function buildLanJoinUrl(
  protocol: string,
  host: string,
  port: string,
  roomCode: string,
): string {
  const code = normalizeRoomCode(roomCode);
  const portSuffix =
    port && port !== "80" && port !== "443" ? `:${port}` : "";
  const scheme = protocol.endsWith(":") ? protocol : `${protocol}:`;
  return `${scheme}//${host}${portSuffix}/input?${JOIN_CODE_PARAM}=${encodeURIComponent(code)}`;
}

export function readRoomCodeFromSearchParams(
  params: URLSearchParams,
): string | null {
  const raw =
    params.get(JOIN_CODE_PARAM) ?? params.get(LEGACY_ROOM_PARAM) ?? "";
  const code = normalizeRoomCode(raw);
  return code.length > 0 ? code : null;
}
