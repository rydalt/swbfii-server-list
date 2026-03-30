import type { ClientServer, ClientMember } from "./types";

export function hostHTML(members: ClientMember[]): string {
  const m = (members || []).find(m => m.username);
  if (!m || !m.username) return "\u2014";
  let profileUrl = m.steam_profile;
  if (!profileUrl && !m.username.startsWith("Steam.")) {
    profileUrl = "https://www.gog.com/u/" + encodeURIComponent(m.username);
  }
  const nameHtml = profileUrl
    ? '<a class="player-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener">' + esc(m.username) + '</a>'
    : '<span>' + esc(m.username) + '</span>';
  return '<span class="host-cell">' +
    (m.avatar ? '<img class="host-avatar" src="' + esc(m.avatar) + '" alt="">' : '') +
    nameHtml + '</span>';
}

export function cleanName(s: string): string {
  return s.replace(/[\x00-\x08]/g, "");
}

export function modeBadgeClass(mode: string): string {
  if (mode.includes("Conquest")) return "conquest";
  if (mode.includes("CTF") || mode.includes("Flag")) return "ctf";
  if (mode.includes("Hero")) return "hero";
  if (mode.includes("Assault")) return "assault";
  if (mode.includes("Hunt")) return "hunt";
  return "";
}

export function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export function yn(b: boolean): string {
  return b ? "Yes" : "No";
}

export function reinf(v: string | undefined): string {
  if (v === undefined || v === "") return "\u2014";
  const n = parseInt(v);
  if (n >= 2147000000 || n < 0) return "\u221E";
  return v;
}

export function difficultyLabel(s: string): string {
  if (s === "easy") return "Easy";
  if (s === "normal") return "Normal";
  if (s === "elite") return "Elite";
  return s;
}

export function heroRule(raw: Record<string, string>, key: string): string {
  const v = raw[key];
  if (v === undefined) return "\u2014";
  return v;
}

export function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + "m ago";
  return Math.floor(sec / 3600) + "h ago";
}

export function detailHTML(s: ClientServer): string {
  const r = s.raw_settings || {};
  const items: [string, string, boolean?][] = [
    ["Map Code", esc(s.map)],
    ["Tick Rate", s.turns_per_second + " Hz"],
    ["AI Difficulty", difficultyLabel(s.difficulty)],
    ["Password", s.password_protected ? "\uD83D\uDD12 Yes" : "No"],
    ["Heroes", yn(s.heroes_enabled), s.heroes_enabled],
    ["Team Damage", yn(s.team_damage), s.team_damage],
    ["Auto-Aim", yn(s.auto_aim), s.auto_aim],
    ["Auto-Assign Teams", yn(!!parseInt(r["fgr_bool_netAutoAssignTeams"] || "0")), !!parseInt(r["fgr_bool_netAutoAssignTeams"] || "0")],
    ["Show Names", yn(!!parseInt(r["fgr_int_netShowNames"] || "0")), !!parseInt(r["fgr_int_netShowNames"] || "0")],
    ["Spawn Invincibility", (r["fgr_int_gSpawnInvicibility"] || "0") + "s"],
    ["Reinforcements", reinf(r["fgr_int_r1"])],
    ["Hero Unlock Rule", heroRule(r, "fgr_uint_netHeroRuleUnlock")],
    ["Hero Unlock Value", heroRule(r, "fgr_int_netHeroRuleUnlockVal")],
    ["Hero Respawn Rule", heroRule(r, "fgr_uint_netHeroRuleRespawn")],
    ["Hero Respawn Timer", (r["fgr_uint_netHeroRuleRespawnVal"] || "\u2014") + "s"],
    ["Hero Team Rule", heroRule(r, "fgr_uint_netHeroRuleTeam")],
    ["Hero Player Rule", heroRule(r, "fgr_uint_netHeroRulePlayer")],
    ["Min Players (Dedicated)", r["fgr_int_netMinPlayersToAutoLaunchDedicated"] || "\u2014"],
  ];

  let html = '<div class="detail-grid">' + items.map(([label, value, flag]) => {
    let cls = "";
    if (flag === true) cls = " on";
    else if (flag === false) cls = " off";
    return '<div class="dg-item"><span class="dg-label">' + label + '</span><span class="dg-value' + cls + '">' + value + '</span></div>';
  }).join("") + '</div>';

  const members = (s.members || []).filter(m => m.username);
  if (members.length > 0) {
    html += '<div class="player-list"><div class="player-list-title">Players (' + members.length + ')</div>';
    html += members.map(m => {
      let profileUrl = m.steam_profile;
      if (!profileUrl && m.username && !m.username.startsWith("Steam.")) {
        profileUrl = "https://www.gog.com/u/" + encodeURIComponent(m.username);
      }
      const nameHtml = profileUrl
        ? '<a class="player-link" href="' + esc(profileUrl) + '" target="_blank" rel="noopener">' + esc(m.username!) + '</a>'
        : "<span>" + esc(m.username!) + "</span>";
      return '<div class="player-chip">' +
        (m.avatar ? '<img class="player-avatar" src="' + esc(m.avatar) + '" alt="">' : "") +
        nameHtml +
        "</div>";
    }).join("") + "</div>";
  }

  return html;
}
