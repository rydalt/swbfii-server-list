export const STYLES = `
  :root {
    --bg: #0a0e17;
    --surface: #111827;
    --surface2: #1a2234;
    --border: #1e293b;
    --text: #e2e8f0;
    --dim: #94a3b8;
    --accent: #f59e0b;
    --green: #22c55e;
    --red: #ef4444;
    --blue: #60a5fa;
    --purple: #c084fc;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }
  header {
    padding: 24px 32px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: baseline;
    gap: 16px;
    flex-wrap: wrap;
  }
  header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  header h1 span { color: var(--accent); }
  .meta {
    font-size: 0.8rem;
    color: var(--dim);
    display: flex;
    gap: 16px;
    align-items: center;
    margin-left: auto;
  }
  .meta .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--green);
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 50% { opacity: .4; } }

  /* ── Tabs ── */
  .tab-bar {
    display: flex;
    gap: 0;
    padding: 0 32px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .tab-btn {
    padding: 12px 24px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--dim);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    font-family: inherit;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; }

  /* ── Stats bar ── */
  .stats {
    display: flex;
    gap: 12px;
    padding: 16px 32px;
    flex-wrap: wrap;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 20px;
    min-width: 130px;
    flex: 1;
  }
  .stat-card .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--dim);
    margin-bottom: 4px;
  }
  .stat-card .value {
    font-size: 1.4rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .stat-card .value.accent { color: var(--accent); }
  .stat-card .value.green { color: var(--green); }
  .stat-card .value.blue { color: var(--blue); }
  .stat-card .value.purple { color: var(--purple); }

  .container { padding: 0 32px 32px; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  thead th {
    text-align: left;
    padding: 10px 12px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
    border-bottom: 2px solid var(--border);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  thead th:hover { color: var(--text); }
  thead th.sorted { color: var(--accent); }
  thead th .arrow { font-size: 0.65rem; margin-left: 4px; }
  tbody tr.server-row {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
    cursor: pointer;
  }
  tbody tr.server-row:hover { background: rgba(255,255,255,0.03); }
  tbody td {
    padding: 10px 12px;
    vertical-align: middle;
    white-space: nowrap;
  }
  .server-name {
    font-weight: 600;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .expand-arrow {
    display: inline-block;
    width: 16px;
    font-size: 0.65rem;
    color: var(--dim);
    transition: transform 0.2s;
  }
  tr.server-row.expanded .expand-arrow { transform: rotate(90deg); }
  .lock { color: var(--accent); margin-right: 6px; font-size: 0.8rem; }
  .players { font-variant-numeric: tabular-nums; }
  .players .current { color: var(--green); font-weight: 600; }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    background: rgba(245,158,11,0.15);
    color: var(--accent);
  }
  .badge.conquest { background: rgba(34,197,94,0.15); color: var(--green); }
  .badge.ctf { background: rgba(59,130,246,0.15); color: var(--blue); }
  .badge.hero { background: rgba(168,85,247,0.15); color: var(--purple); }
  .badge.assault { background: rgba(239,68,68,0.15); color: var(--red); }
  .badge.hunt { background: rgba(234,179,8,0.15); color: #fbbf24; }
  .heroes-on { color: var(--green); }
  .heroes-off { color: var(--dim); }
  .tick { color: var(--dim); font-variant-numeric: tabular-nums; }

  /* ── Detail row ── */
  tr.detail-row { display: none; }
  tr.detail-row.open { display: table-row; }
  tr.detail-row td {
    padding: 0 12px 16px 40px;
    border-bottom: 1px solid var(--border);
    white-space: normal;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px 24px;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: 6px;
    border: 1px solid var(--border);
    font-size: 0.8rem;
  }
  .detail-grid .dg-item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .detail-grid .dg-label {
    color: var(--dim);
    white-space: nowrap;
  }
  .detail-grid .dg-value {
    color: var(--text);
    font-weight: 500;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .detail-grid .dg-value.on { color: var(--green); }
  .detail-grid .dg-value.off { color: var(--dim); }

  /* ── Player list ── */
  .player-list {
    margin-top: 10px;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: 6px;
    border: 1px solid var(--border);
  }
  .player-list-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .player-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    margin: 3px 4px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 16px;
    font-size: 0.8rem;
  }
  .player-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .host-cell {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .host-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    vertical-align: middle;
  }
  .player-link {
    color: var(--blue);
    text-decoration: none;
  }
  .player-link:hover {
    text-decoration: underline;
  }

  #error {
    text-align: center;
    padding: 24px;
    color: var(--red);
    display: none;
  }
  @media (max-width: 900px) {
    header, .stats, .container { padding-left: 16px; padding-right: 16px; }
    .tab-bar { padding: 0 16px; }
    .tab-btn { padding: 10px 16px; font-size: 0.8rem; }
    .hide-mobile { display: none; }
    .server-name { max-width: 180px; }
    .stats { gap: 8px; }
    .stat-card { min-width: 90px; padding: 10px 14px; }
    .stat-card .value { font-size: 1.1rem; }
    .detail-grid { grid-template-columns: 1fr; }
    .charts { grid-template-columns: 1fr; }
    .chart-card { }
    .chart-wrap { height: 200px; }
    .chart-wide .chart-wrap { height: 220px; }
  }

  /* ── Charts ── */
  .charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 0 32px 32px;
  }
  .chart-wide { grid-column: 1 / -1; }
  .chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    position: relative;
  }
  .chart-card.chart-wide { }
  .chart-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
    margin-bottom: 12px;
    font-weight: 600;
  }
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 12px;
  }
  .chart-header .chart-title { margin-bottom: 0; }
  .chart-header .time-range { padding: 0; gap: 4px; display: flex; }
  .chart-wrap {
    position: relative;
    width: 100%;
    height: 260px;
  }
  .chart-wide .chart-wrap {
    height: 300px;
  }

  /* ── Time range selector ── */
  .time-range {
    display: flex;
    gap: 4px;
  }
  .time-btn {
    padding: 4px 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--dim);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .time-btn:hover { color: var(--text); border-color: var(--dim); }
  .time-btn.active {
    color: var(--accent);
    border-color: var(--accent);
    background: rgba(245,158,11,0.1);
  }
`;
