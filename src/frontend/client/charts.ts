import type { ClientServer, HistorySnapshot } from "./types";

export const CHART_COLORS = [
  "#f59e0b", "#22c55e", "#60a5fa", "#c084fc", "#ef4444",
  "#fbbf24", "#34d399", "#818cf8", "#fb7185", "#a78bfa",
  "#38bdf8", "#fb923c",
];

export const MODE_COLORS: Record<string, string> = {
  "Conquest": "#22c55e",
  "Capture the Flag": "#60a5fa",
  "1-Flag CTF": "#3b82f6",
  "Hero Assault": "#c084fc",
  "Assault": "#ef4444",
  "Hunt": "#fbbf24",
  "Campaign": "#f59e0b",
  "Unknown": "#64748b",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1a2234",
  titleColor: "#e2e8f0",
  bodyColor: "#e2e8f0",
  borderColor: "#1e293b",
  borderWidth: 1,
};

export function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

export function formatTimeLabel(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function renderActivityChart(
  history: HistorySnapshot[],
  selectedRange: number,
  existingChart: Chart | null,
): Chart {
  const ctx = document.getElementById("activity-chart") as HTMLCanvasElement;
  const now = Date.now();
  const rangeMin = now - selectedRange * 1000;
  const playersData = history.map(h => ({ x: h.t * 1000, y: h.p }));
  const serversData = history.map(h => ({ x: h.t * 1000, y: h.s }));

  if (existingChart) {
    existingChart.data.datasets[0].data = playersData;
    existingChart.data.datasets[1].data = serversData;
    existingChart.options.scales.x.min = rangeMin;
    existingChart.options.scales.x.max = now;
    existingChart.update("none");
    return existingChart;
  }

  return new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Players",
          data: playersData,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.08)",
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
          borderWidth: 2,
        },
        {
          label: "Servers",
          data: serversData,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245,158,11,0.08)",
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHitRadius: 8,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#94a3b8", usePointStyle: true, pointStyle: "circle" } },
        tooltip: TOOLTIP_STYLE,
      },
      scales: {
        x: {
          type: "time",
          min: rangeMin,
          max: now,
          time: {
            tooltipFormat: "MMM d, HH:mm",
            displayFormats: { minute: "HH:mm", hour: "HH:mm", day: "MMM d" },
          },
          ticks: { color: "#94a3b8", maxTicksLimit: 12, maxRotation: 0 },
          grid: { color: "rgba(30,41,59,0.5)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#94a3b8", stepSize: 1 },
          grid: { color: "rgba(30,41,59,0.5)" },
        },
      },
    },
  });
}

export function renderMapChart(
  serverData: ClientServer[],
  existingChart: Chart | null,
): Chart | null {
  const ctx = document.getElementById("map-chart") as HTMLCanvasElement;
  const mapPlayers: Record<string, number> = {};
  serverData.forEach(s => {
    mapPlayers[s.map_name] = (mapPlayers[s.map_name] || 0) + s.players;
  });
  const sorted = Object.entries(mapPlayers).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const newLabels = sorted.map(e => e[0]);
  const newData = sorted.map(e => e[1]);
  const newColors = sorted.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  if (existingChart) {
    existingChart.data.labels = newLabels;
    existingChart.data.datasets[0].data = newData;
    existingChart.data.datasets[0].backgroundColor = newColors;
    existingChart.update("none");
    return existingChart;
  }

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: newLabels,
      datasets: [{
        data: newData,
        backgroundColor: newColors,
        borderColor: "#111827",
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "#94a3b8", boxWidth: 12, padding: 8, font: { size: 11 } } },
        tooltip: TOOLTIP_STYLE,
      },
    },
  });
}

export function renderModeChart(
  serverData: ClientServer[],
  existingChart: Chart | null,
): Chart | null {
  const ctx = document.getElementById("mode-chart") as HTMLCanvasElement;
  const modePlayers: Record<string, number> = {};
  serverData.forEach(s => {
    modePlayers[s.mode || "Unknown"] = (modePlayers[s.mode || "Unknown"] || 0) + s.players;
  });
  const sorted = Object.entries(modePlayers).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const newLabels = sorted.map(e => e[0]);
  const newData = sorted.map(e => e[1]);
  const newColors = sorted.map(([mode], i) => MODE_COLORS[mode] || CHART_COLORS[i % CHART_COLORS.length]);

  if (existingChart) {
    existingChart.data.labels = newLabels;
    existingChart.data.datasets[0].data = newData;
    existingChart.data.datasets[0].backgroundColor = newColors;
    existingChart.update("none");
    return existingChart;
  }

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: newLabels,
      datasets: [{
        data: newData,
        backgroundColor: newColors,
        borderColor: "#111827",
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "#94a3b8", boxWidth: 12, padding: 8, font: { size: 11 } } },
        tooltip: TOOLTIP_STYLE,
      },
    },
  });
}

export function buildStackedChart(
  canvasId: string,
  history: HistorySnapshot[],
  keyField: "maps" | "modes",
  colorMap: Record<string, string>,
  fallbackColors: string[],
  existingChart: Chart | null,
): Chart | null {
  const ctx = document.getElementById(canvasId) as HTMLCanvasElement;

  const allKeys = new Set<string>();
  history.forEach(h => {
    const obj = h[keyField];
    if (obj) Object.keys(obj).forEach(k => allKeys.add(k));
  });
  if (allKeys.size === 0) return null;

  const totals: Record<string, number> = {};
  history.forEach(h => {
    const obj = h[keyField];
    if (!obj) return;
    for (const [k, v] of Object.entries(obj)) {
      totals[k] = (totals[k] || 0) + v;
    }
  });
  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const topKeys = ranked.slice(0, 8).map(e => e[0]);
  const hasOther = ranked.length > 8;

  const now = Date.now();
  const selectedRange = parseInt(
    document.querySelector<HTMLButtonElement>(".time-btn.active")?.dataset.range || "3600",
  );
  const rangeMin = now - selectedRange * 1000;

  const datasets = topKeys.map((key, i) => {
    const color = colorMap[key] || fallbackColors[i % fallbackColors.length];
    return {
      label: key,
      data: history.map(h => ({ x: h.t * 1000, y: (h[keyField] && h[keyField][key]) || 0 })),
      backgroundColor: hexToRgba(color, 0.6),
      borderColor: color,
      borderWidth: 1,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 6,
      tension: 0.3,
    };
  });

  if (hasOther) {
    datasets.push({
      label: "Other",
      data: history.map(h => {
        const obj = h[keyField];
        if (!obj) return { x: h.t * 1000, y: 0 };
        let sum = 0;
        for (const [k, v] of Object.entries(obj)) {
          if (!topKeys.includes(k)) sum += v;
        }
        return { x: h.t * 1000, y: sum };
      }),
      backgroundColor: "rgba(100,116,139,0.4)",
      borderColor: "#64748b",
      borderWidth: 1,
      fill: true,
      pointRadius: 0,
      pointHitRadius: 6,
      tension: 0.3,
    });
  }

  if (existingChart) existingChart.destroy();

  return new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#94a3b8", usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 8, font: { size: 11 } } },
        tooltip: { ...TOOLTIP_STYLE, mode: "index" },
      },
      scales: {
        x: {
          type: "time",
          min: rangeMin,
          max: now,
          time: {
            tooltipFormat: "MMM d, HH:mm",
            displayFormats: { minute: "HH:mm", hour: "HH:mm", day: "MMM d" },
          },
          ticks: { color: "#94a3b8", maxTicksLimit: 12, maxRotation: 0 },
          grid: { color: "rgba(30,41,59,0.5)" },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: "#94a3b8", stepSize: 1 },
          grid: { color: "rgba(30,41,59,0.5)" },
          title: { display: true, text: "Players", color: "#94a3b8" },
        },
      },
    },
  });
}
