import { getToken, type Env } from "./gog-auth";
import { fetchServers, type ServerList } from "./matchmaking";
import { HTML } from "./frontend/index";
import { FAVICON_B64 } from "./favicon";

const KV_SERVERS_KEY = "server_list";
const KV_HISTORY_KEY = "history";

interface Snapshot {
  t: number;
  p: number;
  s: number;
  maps: Record<string, number>;
  modes: Record<string, number>;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Cap a record to the top N entries by value, truncate keys to maxLen. */
function capRecord(rec: Record<string, number>, maxEntries: number, maxKeyLen: number): Record<string, number> {
  const entries = Object.entries(rec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxEntries);
  const out: Record<string, number> = {};
  for (const [k, v] of entries) {
    out[k.slice(0, maxKeyLen)] = v;
  }
  return out;
}

/** Append a compact snapshot to the 7-day history ring in KV.
 *  Keeps 1-min granularity for last 24h, downsamples to 5-min for older data. */
async function appendHistory(env: Env, list: ServerList): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const players = list.servers.reduce((a, s) => a + s.players, 0);

  const maps: Record<string, number> = {};
  const modes: Record<string, number> = {};
  for (const s of list.servers) {
    maps[s.map_name] = (maps[s.map_name] ?? 0) + s.players;
    const mode = s.mode || "Unknown";
    modes[mode] = (modes[mode] ?? 0) + s.players;
  }

  const snap: Snapshot = {
    t: now, p: players, s: list.total,
    maps: capRecord(maps, 30, 40),
    modes: capRecord(modes, 10, 30),
  };

  let history: Snapshot[] = [];
  const raw = await env.KV.get(KV_HISTORY_KEY);
  if (raw) {
    try { history = JSON.parse(raw); } catch { /* ignore corrupt data */ }
  }

  history.push(snap);

  // Trim to last 7 days
  const weekAgo = now - 604800;
  history = history.filter(h => h.t >= weekAgo);

  // Downsample: anything older than 24h gets compressed to 5-min buckets
  const dayAgo = now - 86400;
  const recent = history.filter(h => h.t >= dayAgo);
  const older = history.filter(h => h.t < dayAgo);

  if (older.length > 0) {
    const buckets = new Map<number, Snapshot[]>();
    for (const h of older) {
      const bucket = Math.floor(h.t / 300) * 300;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(h);
    }
    const downsampled: Snapshot[] = [];
    for (const [bucket, snaps] of buckets) {
      const avgP = Math.round(snaps.reduce((a, s) => a + s.p, 0) / snaps.length);
      const avgS = Math.round(snaps.reduce((a, s) => a + s.s, 0) / snaps.length);
      // Merge maps/modes by averaging
      const mergedMaps: Record<string, number> = {};
      const mergedModes: Record<string, number> = {};
      for (const s of snaps) {
        for (const [k, v] of Object.entries(s.maps ?? {})) mergedMaps[k] = (mergedMaps[k] ?? 0) + v;
        for (const [k, v] of Object.entries(s.modes ?? {})) mergedModes[k] = (mergedModes[k] ?? 0) + v;
      }
      for (const k of Object.keys(mergedMaps)) mergedMaps[k] = Math.round(mergedMaps[k] / snaps.length);
      for (const k of Object.keys(mergedModes)) mergedModes[k] = Math.round(mergedModes[k] / snaps.length);
      downsampled.push({ t: bucket, p: avgP, s: avgS, maps: mergedMaps, modes: mergedModes });
    }
    history = [...downsampled.sort((a, b) => a.t - b.t), ...recent];
  } else {
    history = recent;
  }

  let json = JSON.stringify(history);
  const MAX_HISTORY_BYTES = 20 * 1024 * 1024; // 20 MiB

  // If over limit, drop oldest snapshots until under cap
  while (history.length > 0 && json.length > MAX_HISTORY_BYTES) {
    history.shift();
    json = JSON.stringify(history);
  }

  await env.KV.put(KV_HISTORY_KEY, json, { expirationTtl: 691200 });
}

/** Refresh server list from GOG and store in KV. */
async function refreshServers(env: Env): Promise<ServerList> {
  const token = await getToken(env);
  const list = await fetchServers(token, env.KV);
  await env.KV.put(KV_SERVERS_KEY, JSON.stringify(list), { expirationTtl: 300 });
  await appendHistory(env, list);
  return list;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/servers") {
      // Serve from KV cache, or fetch fresh if missing.
      let cached = await env.KV.get(KV_SERVERS_KEY);
      if (!cached) {
        try {
          const list = await refreshServers(env);
          cached = JSON.stringify(list);
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 502,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
      }
      return new Response(cached, {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/history") {
      const raw = await env.KV.get(KV_HISTORY_KEY);
      return new Response(raw || "[]", {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/health") {
      return new Response("ok", { headers: CORS_HEADERS });
    }

    if (url.pathname === "/favicon.ico") {
      const buf = Uint8Array.from(atob(FAVICON_B64), c => c.charCodeAt(0));
      return new Response(buf, {
        headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=604800" },
      });
    }

    // Serve frontend at root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60" },
      });
    }

    return new Response("Not found", { status: 404, headers: CORS_HEADERS });
  },

  /** Cron trigger — refresh server list every 5 minutes. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshServers(env).then(
      (list) => console.log(`Cron refresh: ${list.total} servers`),
      (err) => console.error(`Cron refresh failed: ${err}`),
    ));
  },
} satisfies ExportedHandler<Env>;
