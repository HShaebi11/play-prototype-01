import { networkInterfaces } from "node:os";

/** First non-internal IPv4 — used to build phone join URLs when laptop uses localhost. */
export function getLanHost(): string | null {
  const nets = networkInterfaces();

  for (const entries of Object.values(nets)) {
    if (!entries) {
      continue;
    }

    for (const net of entries) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return null;
}
