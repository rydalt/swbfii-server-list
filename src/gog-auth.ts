export interface Env {
  KV: KVNamespace;
  GOG_CLIENT_ID: string;
  GOG_CLIENT_SECRET: string;
  GOG_REFRESH_TOKEN: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  user_id: string;
}

interface CachedToken {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
}

const KV_TOKEN_KEY = "gog_token";

/**
 * Get a valid access token, refreshing via GOG OAuth if expired.
 * Caches both access_token and refresh_token in KV.
 */
export async function getToken(env: Env): Promise<string> {
  const cached = await env.KV.get<CachedToken>(KV_TOKEN_KEY, "json");

  if (cached && Date.now() < cached.expires_at) {
    return cached.access_token;
  }

  // Use cached refresh_token if available (GOG may rotate it), else fall back to env.
  const refreshToken = cached?.refresh_token ?? env.GOG_REFRESH_TOKEN;

  const url = new URL("https://auth.gog.com/token");
  url.searchParams.set("client_id", env.GOG_CLIENT_ID);
  url.searchParams.set("client_secret", env.GOG_CLIENT_SECRET);
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("refresh_token", refreshToken);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`GOG token refresh failed (${resp.status}): ${body}`);
  }

  const data: TokenResponse = await resp.json();

  const entry: CachedToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 300) * 1000, // 5-min buffer
  };

  await env.KV.put(KV_TOKEN_KEY, JSON.stringify(entry), {
    expirationTtl: data.expires_in,
  });

  return data.access_token;
}
