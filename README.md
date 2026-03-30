# SWBF2 Server Browser

A live server browser for Star Wars Battlefront II (2005) built on Cloudflare Workers.

## Features

- Real-time server list with player counts, maps, modes, and host info
- Expandable server details (AI difficulty, hero rules, reinforcements, tick rate, etc.)
- Player list with avatars and links to GOG/Steam profiles
- Sortable columns with mobile-friendly layout
- Historical charts — player/server activity, map & mode popularity (7-day retention)
- Auto-refreshes

## How It Works

A cron trigger runs every 5 minutes, authenticating with the GOG Galaxy API via OAuth2 refresh token and fetching the current matchmaking lobbies. Server data is cached in Cloudflare KV along with a rolling history of snapshots. The frontend is served as a single HTML page with an embedded TypeScript client bundle.

## Setup

### Prerequisites

- Node.js 18+
- A [Cloudflare Workers](https://workers.cloudflare.com/) account
- GOG Galaxy API credentials (client ID, client secret, refresh token)

### Configure Secrets

Create a `.dev.vars` file for local development:

```
GOG_CLIENT_ID=your_client_id
GOG_CLIENT_SECRET=your_client_secret
GOG_REFRESH_TOKEN=your_refresh_token
```

For production, set these as Wrangler secrets:

```sh
npx wrangler secret put GOG_CLIENT_ID
npx wrangler secret put GOG_CLIENT_SECRET
npx wrangler secret put GOG_REFRESH_TOKEN
```

### Run & Deploy

```sh
npm install          # Install dependencies
npm run dev          # Local development (builds client + starts wrangler dev)
npm run deploy       # Production deploy (builds client + wrangler deploy)
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
```

## License

[ISC](LICENSE)