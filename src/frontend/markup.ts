export const MARKUP = `
<header>
  <h1>SWBF<span>II</span> Servers</h1>
  <div class="meta">
    <span><span class="dot"></span> Live</span>
    <span>Updated <span id="updated">—</span></span>
  </div>
</header>

<div class="tab-bar">
  <button class="tab-btn active" data-tab="servers">Servers</button>
  <button class="tab-btn" data-tab="stats">Stats</button>
</div>

<div id="loading" style="text-align:center;padding:64px;color:var(--dim);font-size:1rem">Loading servers…</div>
<div id="error"></div>

<div class="stats" id="stats" style="display:none">
  <div class="stat-card">
    <div class="label">Servers Online</div>
    <div class="value accent" id="st-servers">—</div>
  </div>
  <div class="stat-card" id="players-card" title="">
    <div class="label">Players Online</div>
    <div class="value green" id="st-players">—</div>
  </div>
  <div class="stat-card">
    <div class="label">Total Bots</div>
    <div class="value blue" id="st-bots">—</div>
  </div>
  <div class="stat-card" title="Map with the most players right now">
    <div class="label">Top Map</div>
    <div class="value purple" id="st-topmap" style="font-size:1rem">—</div>
  </div>
  <div class="stat-card">
    <div class="label">Password Protected</div>
    <div class="value" id="st-locked" style="color:var(--dim)">—</div>
  </div>
</div>

<div id="tab-stats" class="tab-panel">
<div class="charts" id="charts" style="display:none">
  <div class="chart-card chart-wide">
    <div class="chart-header">
      <div class="chart-title">Player &amp; Server Activity</div>
      <div class="time-range">
        <button class="time-btn active" data-range="3600">1h</button>
        <button class="time-btn" data-range="43200">12h</button>
        <button class="time-btn" data-range="86400">1d</button>
        <button class="time-btn" data-range="604800">7d</button>
      </div>
    </div>
    <div class="chart-wrap"><canvas id="activity-chart"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="chart-title">Current Map Popularity</div>
    <div class="chart-wrap"><canvas id="map-chart"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="chart-title">Current Game Modes</div>
    <div class="chart-wrap"><canvas id="mode-chart"></canvas></div>
  </div>
  <div class="chart-card chart-wide">
    <div class="chart-title">Map Popularity Over Time</div>
    <div class="chart-wrap"><canvas id="map-history-chart"></canvas></div>
  </div>
  <div class="chart-card chart-wide">
    <div class="chart-title">Game Mode Popularity Over Time</div>
    <div class="chart-wrap"><canvas id="mode-history-chart"></canvas></div>
  </div>
</div>
</div>

<div id="tab-servers" class="tab-panel active">
<div class="container">
  <table id="table" style="display:none">
    <thead>
      <tr>
        <th style="width:24px"></th>
        <th data-key="name">Server <span class="arrow"></span></th>
        <th data-key="host" class="hide-mobile">Host <span class="arrow"></span></th>
        <th data-key="map_name">Map <span class="arrow"></span></th>
        <th data-key="mode">Mode <span class="arrow"></span></th>
        <th data-key="players" data-type="num">Players <span class="arrow"></span></th>
        <th data-key="bots_per_team" data-type="num" class="hide-mobile">Bots/Team <span class="arrow"></span></th>
        <th data-key="heroes_enabled" class="hide-mobile">Heroes <span class="arrow"></span></th>
        <th data-key="turns_per_second" data-type="num" class="hide-mobile">Tick <span class="arrow"></span></th>
      </tr>
    </thead>
    <tbody id="body"></tbody>
  </table>
</div>
</div>
`;
