import type { ClientServer, HistorySnapshot } from "./types";
import { cleanName, modeBadgeClass, esc, hostHTML, detailHTML, timeAgo } from "./utils";
import {
  CHART_COLORS, MODE_COLORS,
  renderActivityChart, renderMapChart, renderModeChart, buildStackedChart,
} from "./charts";

const API = "/servers";
const COL_COUNT = 9;

let servers: ClientServer[] = [];
let sortKey = "players";
let sortAsc = false;
const expanded = new Set<string>();

let activityChart: Chart | null = null;
let mapChart: Chart | null = null;
let modeChart: Chart | null = null;
let mapHistoryChart: Chart | null = null;
let modeHistoryChart: Chart | null = null;
let fullHistory: HistorySnapshot[] = [];
let selectedRange = 3600;

const RANGE_LABELS: Record<number, string> = {
  3600: "1h", 43200: "12h", 86400: "1d", 604800: "7d",
};

function filterHistory(range: number): HistorySnapshot[] {
  const cutoff = Math.floor(Date.now() / 1000) - range;
  return fullHistory.filter(h => h.t >= cutoff);
}

function updateStats(): void {
  const total = servers.length;
  const players = servers.reduce((a, s) => a + s.players, 0);
  const bots = servers.reduce((a, s) => a + s.bots_per_team * 2, 0);
  const locked = servers.filter(s => s.password_protected).length;

  const mapPlayers: Record<string, number> = {};
  servers.forEach(s => {
    mapPlayers[s.map_name] = (mapPlayers[s.map_name] || 0) + s.players;
  });
  let topMap = "\u2014";
  let topCount = 0;
  for (const [m, c] of Object.entries(mapPlayers)) {
    if (c > topCount) { topCount = c; topMap = m; }
  }

  document.getElementById("st-servers")!.textContent = String(total);
  document.getElementById("st-players")!.textContent = String(players);
  document.getElementById("st-bots")!.textContent = String(bots);
  document.getElementById("st-topmap")!.textContent = topMap;
  document.getElementById("st-locked")!.textContent = locked + " / " + total;
  document.getElementById("stats")!.style.display = "";
}

function render(): void {
  const getVal = (s: ClientServer, key: string): string | number | boolean => {
    if (key === "host") return (s.members || []).find(m => m.username)?.username || "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (s as any)[key];
  };

  const sorted = [...servers].sort((a, b) => {
    let va: string | number | boolean = getVal(a, sortKey);
    let vb: string | number | boolean = getVal(b, sortKey);
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (typeof va === "boolean") { va = va ? 1 : 0; vb = (vb as boolean) ? 1 : 0; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const tbody = document.getElementById("body")!;
  tbody.innerHTML = sorted.map((s, i) => {
    const id = s.name + "|" + i;
    const isOpen = expanded.has(id);
    return `
    <tr class="server-row${isOpen ? " expanded" : ""}" data-id="${esc(String(id))}">
      <td><span class="expand-arrow">\u25B6</span></td>
      <td class="server-name">
        ${s.password_protected ? '<span class="lock">\uD83D\uDD12</span>' : ""}
        ${esc(cleanName(s.name))}
      </td>
      <td class="hide-mobile">${hostHTML(s.members)}</td>
      <td>${esc(s.map_name)}</td>
      <td><span class="badge ${modeBadgeClass(s.mode)}">${esc(s.mode)}</span></td>
      <td class="players"><span class="current">${s.players}</span> / ${s.max_players}</td>
      <td class="hide-mobile">${s.bots_per_team}</td>
      <td class="hide-mobile ${s.heroes_enabled ? "heroes-on" : "heroes-off"}">
        ${s.heroes_enabled ? "\u2713" : "\u2014"}
      </td>
      <td class="hide-mobile tick">${s.turns_per_second} Hz</td>
    </tr>
    <tr class="detail-row${isOpen ? " open" : ""}" data-detail-id="${esc(String(id))}">
      <td colspan="${COL_COUNT}">${detailHTML(s)}</td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll<HTMLTableRowElement>("tr.server-row").forEach(row => {
    row.addEventListener("click", () => {
      const id = row.dataset.id!;
      const detail = tbody.querySelector('tr[data-detail-id="' + id + '"]') as HTMLElement;
      if (expanded.has(id)) {
        expanded.delete(id);
        row.classList.remove("expanded");
        detail.classList.remove("open");
      } else {
        expanded.add(id);
        row.classList.add("expanded");
        detail.classList.add("open");
      }
    });
  });

  document.querySelectorAll<HTMLTableCellElement>("thead th[data-key]").forEach(th => {
    th.classList.toggle("sorted", th.dataset.key === sortKey);
    th.querySelector(".arrow")!.textContent =
      th.dataset.key === sortKey ? (sortAsc ? "\u25B2" : "\u25BC") : "";
  });

  updateStats();
}

function renderTimeCharts(): void {
  const filtered = filterHistory(selectedRange);
  if (activityChart) { activityChart.destroy(); activityChart = null; }
  if (mapHistoryChart) { mapHistoryChart.destroy(); mapHistoryChart = null; }
  if (modeHistoryChart) { modeHistoryChart.destroy(); modeHistoryChart = null; }

  if (filtered.length > 0) {
    activityChart = renderActivityChart(filtered, selectedRange, null);
    mapHistoryChart = buildStackedChart("map-history-chart", filtered, "maps", {}, CHART_COLORS, null);
    modeHistoryChart = buildStackedChart("mode-history-chart", filtered, "modes", MODE_COLORS, CHART_COLORS, null);
    const peak = Math.max(...filtered.map(h => h.p));
    const rangeLabel = RANGE_LABELS[selectedRange] || "1h";
    document.getElementById("players-card")!.title = "Peak (" + rangeLabel + "): " + peak;
  }
}

async function load(): Promise<void> {
  try {
    const [serversResp, historyResp] = await Promise.all([
      fetch(API),
      fetch("/history"),
    ]);
    if (!serversResp.ok) throw new Error(`HTTP ${serversResp.status}`);
    const data = await serversResp.json();
    servers = data.servers || [];
    document.getElementById("updated")!.textContent = timeAgo(data.fetched_at);
    document.getElementById("loading")!.style.display = "none";
    (document.getElementById("table") as HTMLElement).style.display = "";
    render();

    if (historyResp.ok) {
      fullHistory = await historyResp.json();
      if (!activityChart) {
        renderTimeCharts();
      } else {
        const filtered = filterHistory(selectedRange);
        if (filtered.length > 0) {
          const now = Date.now();
          const rangeMin = now - selectedRange * 1000;
          activityChart.data.datasets[0].data = filtered.map(h => ({ x: h.t * 1000, y: h.p }));
          activityChart.data.datasets[1].data = filtered.map(h => ({ x: h.t * 1000, y: h.s }));
          activityChart.options.scales.x.min = rangeMin;
          activityChart.options.scales.x.max = now;
          activityChart.update("none");
          const peak = Math.max(...filtered.map(h => h.p));
          const rangeLabel = RANGE_LABELS[selectedRange] || "1h";
          document.getElementById("players-card")!.title = "Peak (" + rangeLabel + "): " + peak;
        }
        if (mapHistoryChart) { mapHistoryChart.destroy(); mapHistoryChart = null; }
        if (modeHistoryChart) { modeHistoryChart.destroy(); modeHistoryChart = null; }
        const filtered2 = filterHistory(selectedRange);
        if (filtered2.length > 0) {
          mapHistoryChart = buildStackedChart("map-history-chart", filtered2, "maps", {}, CHART_COLORS, null);
          modeHistoryChart = buildStackedChart("mode-history-chart", filtered2, "modes", MODE_COLORS, CHART_COLORS, null);
        }
      }
    }
    if (servers.length > 0) {
      mapChart = renderMapChart(servers, mapChart);
      modeChart = renderModeChart(servers, modeChart);
    }
    document.getElementById("charts")!.style.display = "";
  } catch (e: unknown) {
    document.getElementById("loading")!.style.display = "none";
    const el = document.getElementById("error")!;
    el.style.display = "";
    el.textContent = "Failed to load servers: " + (e instanceof Error ? e.message : String(e));
  }
}

// Sort on header click
document.querySelectorAll<HTMLTableCellElement>("thead th[data-key]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.key;
    if (!key) return;
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = key === "name" || key === "map_name";
    }
    render();
  });
});

// Time range selector
document.querySelectorAll<HTMLButtonElement>(".time-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRange = parseInt(btn.dataset.range || "3600");
    renderTimeCharts();
  });
});

// Tab switching
let chartsRenderedOnce = false;
document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("tab-" + btn.dataset.tab);
    if (panel) panel.classList.add("active");
    if (btn.dataset.tab === "stats" && !chartsRenderedOnce) {
      chartsRenderedOnce = true;
      setTimeout(() => {
        if (activityChart) activityChart.resize();
        if (mapChart) mapChart.resize();
        if (modeChart) modeChart.resize();
        if (mapHistoryChart) mapHistoryChart.resize();
        if (modeHistoryChart) modeHistoryChart.resize();
      }, 50);
    }
  });
});

// Auto-refresh every 60s
load();
setInterval(load, 60000);
