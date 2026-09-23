# Listen — a personal Spotify Wrapped

A local-first web app for **your own Wrapped**, any day of the year. Connect Spotify for live tops and recently played. Optionally import official streaming-history files for minutes, streaks, a calendar, taste patterns, and year-vs-year comparisons.

Nothing from the export is uploaded to a server. Parsing and storage happen in this browser (IndexedDB).

## What you get

| Page | Live Spotify login | Data export |
| --- | --- | --- |
| Dashboard | Official top tracks/artists + recently played | Hours, play counts, hour-of-day chart |
| Wrapped | — | Story slides for the last 12 months |
| Calendar | — | Heatmap, streaks, click a day |
| Taste | Genres + album eras (when URIs exist) | Skips, platforms, discovery, albums |
| Compare | Official 4-week / 6-month / all-time ranks | Month vs month, year vs year, custom ranges |
| Import | — | Zip or JSON, coverage stats |

A listen is counted at **30 seconds**, matching how Spotify typically treats a stream. Shorter plays still affect skip rate.

## Requirements

- Node.js 20+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app if you want real login (sample data works without it)

## Setup

```bash
npm install
cp .env.example .env.local
```

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. App type: **Web**.
3. Redirect URI (must match exactly):
   - Local: `http://127.0.0.1:5173/callback`
   - Production: `https://your-domain.example/callback`
4. Copy the **Client ID** into `.env.local`:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
```

Do **not** put a Client Secret in this project. Login uses Authorization Code + PKCE in the browser.

```bash
npm run dev
```

Open `http://127.0.0.1:5173` (the Vite server binds to `127.0.0.1` so it matches the redirect URI). `localhost` is a different origin to Spotify.

### Friends (Development mode)

Until Spotify approves a quota extension, the app stays in **Development mode**. Add each friend’s Spotify account email under **User Management** on your Developer app (Spotify’s usual cap is 25 users). They run the same URL and log in with their own account. Their history stays in **their** browser.

### Sample data

On the home page, **Explore with sample data** loads a generated year of plays so you can try Wrapped, Calendar, Taste, and Compare without a Developer app.

## Requesting a real export

1. Spotify → account menu → **Account privacy**
2. Request **Extended streaming history** (can take several days)
3. Drop the zip, or the `endsong_*.json` / `Streaming_History_Audio_*.json` / `StreamingHistory*.json` files, on **Import**

Classic “Account data” Streaming History files work too.

## Scripts

```bash
npm run dev       # http://127.0.0.1:5173
npm test          # parser + stats unit tests
npm run build     # typecheck + production bundle
npm run preview   # http://127.0.0.1:4173
```

## Privacy

- Access tokens live in `sessionStorage` and are cleared on sign-out.
- Imported plays are stored per Spotify user id in IndexedDB on that machine.
- Rotate any Client Secret that ever lived in the old Python prototype — it was committed to git history.

## Tech

Vite, React, TypeScript, Tailwind, React Router, Recharts, Framer Motion, Dexie, Spotipy-free Spotify Web API via PKCE.
