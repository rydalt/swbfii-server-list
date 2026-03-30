import { STYLES } from "./styles";
import { MARKUP } from "./markup";
import { CLIENT_JS } from "./client-bundle";

export const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SWBF2 Server Browser</title>
<style>${STYLES}</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
</head>
<body>
${MARKUP}
<script>${CLIENT_JS}</script>
</body>
</html>`;
