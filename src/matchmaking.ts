export interface RawLobby {
  id: string;
  connectivity_mode?: string;
  topology?: string;
  server_address?: string;
  member_max_count?: number;
  members?: { user_id: string; type?: string }[];
  matchmaking?: Record<string, string>;
}

export interface Member {
  user_id: string;
  username: string;
  avatar: string;
  steam_profile?: string;
}

export interface ServerInfo {
  name: string;
  map: string;
  map_name: string;
  mode: string;
  game_type: string;
  players: number;
  max_players: number;
  bots_per_team: number;
  heroes_enabled: boolean;
  team_damage: boolean;
  auto_aim: boolean;
  password_protected: boolean;
  difficulty: string;
  turns_per_second: number;
  members: Member[];
  raw_settings: Record<string, string>;
}

export interface ServerList {
  servers: ServerInfo[];
  total: number;
  fetched_at: string;
}

const MATCHMAKING_URL = "https://multiplayer.gog.com/lobbies/matchmaking";
const USERS_URL = "https://users.gog.com/users";

interface GogUser {
  id: string;
  username: string;
  avatar?: { sdk_img_32?: string };
}

async function resolveUsers(token: string, ids: string[]): Promise<Map<string, { username: string; avatar: string }>> {
  const map = new Map<string, { username: string; avatar: string }>();
  // Fetch in parallel, max 30 concurrent to avoid rate limits
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30));
  }
  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(async (id) => {
        const resp = await fetch(`${USERS_URL}/${id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const user: GogUser = await resp.json();
        map.set(id, {
          username: user.username ?? "",
          avatar: user.avatar?.sdk_img_32 ?? "",
        });
      })
    );
  }
  return map;
}

const STEAM_ID64_BASE = 76561197960265728n;

async function resolveSteamNames(members: Member[]): Promise<void> {
  // Steam players appear with two username patterns from the GOG users API:
  //  - "Steam.{accountId}"    — the number IS a Steam account ID, so we can compute
  //                             SteamID64 = accountId + 76561197960265728 and resolve
  //                             their profile name/avatar via the Steam Community XML API.
  //  - "SteamUser.{gogId}"    — the number is a GOG-internal user ID, NOT a Steam ID.
  //                             There's no public API to map GOG ID → Steam ID, so these
  //                             players are stuck showing the raw placeholder.
  const steamMembers: { member: Member; steamId64: string | null }[] = [];
  for (const m of members) {
    const steamMatch = m.username.match(/^Steam\.(\d+)$/);
    if (steamMatch) {
      const id64 = (STEAM_ID64_BASE + BigInt(steamMatch[1])).toString();
      steamMembers.push({ member: m, steamId64: id64 });
    } else if (/^SteamUser\.\d+$/.test(m.username)) {
      // GOG user ID — can't derive Steam ID, leave username as-is
      steamMembers.push({ member: m, steamId64: null });
    }
  }
  if (steamMembers.length === 0) return;

  await Promise.allSettled(
    steamMembers.map(async ({ member, steamId64 }) => {
      if (!steamId64) return;
      // Always set the profile link even if name resolution fails
      member.steam_profile = `https://steamcommunity.com/profiles/${steamId64}`;
      try {
        const resp = await fetch(
          `https://steamcommunity.com/profiles/${steamId64}/?xml=1`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (!resp.ok) return;
        const xml = await resp.text();
        const nameMatch = xml.match(/steamID><!\[CDATA\[(.+?)\]\]/);
        if (nameMatch) {
          member.username = nameMatch[1];
          member.avatar = "";
          const avatarMatch = xml.match(/avatarMedium><!\[CDATA\[(.+?)\]\]/);
          if (avatarMatch) member.avatar = avatarMatch[1];
        }
      } catch { /* Steam profile resolution is best-effort */ }
    })
  );
}

function num(m: Record<string, string>, key: string): number {
  return parseInt(m[key] ?? "0", 10) || 0;
}

function bool(m: Record<string, string>, key: string): boolean {
  return m[key] === "1";
}

function friendlyMap(code: string): string {
  const base = code.includes("_") ? code.substring(0, code.lastIndexOf("_")) : code;
  let prefix = base;
  if (prefix.endsWith("c") || prefix.endsWith("g")) {
    prefix = prefix.slice(0, -1);
  }
  const maps: Record<string, string> = {
    cor1: "Coruscant: Jedi Temple", dag1: "Dagobah", dea1: "Death Star: Interior",
    end1: "Endor: Bunker", fel1: "Felucia: Marshland", geo1: "Geonosis: Dust Plains",
    hot1: "Hoth: Echo Base", kam1: "Kamino: Tipoca City", kas1: "Kashyyyk: Beachhead",
    kas2: "Kashyyyk: Lagoon", mus1: "Mustafar: Refinery", myg1: "Mygeeto: War-Torn City",
    nab1: "Naboo: Plains", nab2: "Naboo: Theed", pol1: "Polis Massa: Medical Facility",
    PTC: "Polis Massa: Medical Facility", tan1: "Tantive IV: Interior",
    ti2: "Tantive IV: Interior", tat2: "Tatooine: Mos Eisley",
    tat3: "Tatooine: Jabba's Palace", uta1: "Utapau: Sinkhole", yav1: "Yavin 4: Temple",
    spa1: "Space: Coruscant", spa2: "Space: Kashyyyk", spa3: "Space: Mygeeto",
    spa4: "Space: Felucia", spa5: "Space: Hoth", spa6: "Space: Tatooine",
    spa7: "Space: Yavin", spa8: "Space: Mustafar", spa9: "Space: Kamino",
    bes2: "Bespin: Cloud City", ren1: "Rhen Var: Harbor", MFP: "Mos Eisley",
  };
  return maps[prefix] ?? code;
}

function friendlyMode(code: string): string {
  const suffix = code.includes("_") ? code.substring(code.lastIndexOf("_") + 1) : "";
  const modes: Record<string, string> = {
    con: "Conquest", ctf: "Capture the Flag", "1flag": "1-Flag CTF",
    eli: "Hero Assault", ass: "Assault", hunt: "Hunt", c: "Conquest", tat: "Campaign",
  };
  return modes[suffix] ?? suffix;
}

function difficulty(m: Record<string, string>): string {
  switch (m["fgr_int_mDifficulty"]) {
    case "1": return "easy";
    case "2": return "normal";
    case "3": return "elite";
    default: return "unknown";
  }
}

function sanitizeSettings(m: Record<string, string>): Record<string, string> {
  const out = { ...m };
  delete out["galaxy_lobby_password"];
  return out;
}

function parseServer(lobby: RawLobby): ServerInfo {
  const m = lobby.matchmaking ?? {};
  const mapCode = m["fgd_str_map_name"] ?? "";
  return {
    name: m["fgd_str_host_name"] ?? "",
    map: mapCode,
    map_name: friendlyMap(mapCode),
    mode: friendlyMode(mapCode),
    game_type: m["fgd_str_game_type"] ?? "",
    players: num(m, "fgd_int_numPlayers"),
    max_players: lobby.member_max_count ?? 0,
    bots_per_team: num(m, "fgr_int_netNumBots"),
    heroes_enabled: bool(m, "fgr_int_netHeroesEnabled"),
    team_damage: bool(m, "fgr_int_netTeamDamage"),
    auto_aim: bool(m, "fgr_int_netAutoAim"),
    password_protected: !!(m["galaxy_lobby_password"]),
    difficulty: difficulty(m),
    turns_per_second: num(m, "fgd_int_turns_per_second"),
    members: (lobby.members ?? []).map(m => ({ user_id: m.user_id, username: "", avatar: "", steam_profile: undefined as string | undefined })),
    raw_settings: sanitizeSettings(m),
  };
}

export async function fetchServers(token: string): Promise<ServerList> {
  const resp = await fetch(MATCHMAKING_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters: [{ key: "galaxy_lobby_cancelled", type: "ne", value: "1" }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Matchmaking API failed (${resp.status}): ${body}`);
  }

  const data: { items: RawLobby[] } = await resp.json();
  const servers = data.items.map(parseServer);

  // Resolve unique user IDs to usernames
  const allIds = new Set<string>();
  for (const s of servers) {
    for (const m of s.members) allIds.add(m.user_id);
  }
  const userMap = await resolveUsers(token, [...allIds]);
  const allMembers: Member[] = [];
  for (const s of servers) {
    for (const m of s.members) {
      const u = userMap.get(m.user_id);
      if (u) { m.username = u.username; m.avatar = u.avatar; }
      allMembers.push(m);
    }
  }

  // Second pass: resolve Steam.{accountId} names to real Steam persona names
  await resolveSteamNames(allMembers);

  return {
    servers,
    total: servers.length,
    fetched_at: new Date().toISOString(),
  };
}
