import { networkInterfaces } from "node:os";

type LanHostResponse = {
  host: string | null;
};

/** First non-internal IPv4 — used to build phone join URLs when laptop uses localhost. */
export async function GET(): Promise<Response> {
  const nets = networkInterfaces();

  for (const entries of Object.values(nets)) {
    if (!entries) {
      continue;
    }

    for (const net of entries) {
      if (net.family === "IPv4" && !net.internal) {
        return Response.json({ host: net.address } satisfies LanHostResponse);
      }
    }
  }

  return Response.json({ host: null } satisfies LanHostResponse);
}
