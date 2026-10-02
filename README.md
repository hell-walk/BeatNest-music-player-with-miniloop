# BeatNest

A free music player with curated playlists and a **Mini Loop** – pick up to seven songs from any playlist and they play back to back, on repeat.

Version 2 is a full rewrite of the original single-page vanilla JS player as a **React 19 + Vite** client with an **Express 5 + SQLite** backend, in an npm-workspaces monorepo.

```
beatnest/
├── client/          React app (Vite). public/ holds generated icons, images, sitemap, robots
├── server/          Express API, SQLite (node:sqlite), media files, tests
├── shared/          zod schemas, route list and constants used by BOTH client and server
├── scripts/         asset pipeline + launch checks (images, icons, sitemap, links, perf, contrast, secrets)
├── assets-src/      raw source images (covers, backgrounds, logo) – optimised into client/public
├── docs/            LAUNCH-CHECKLIST.md (what was implemented and where), DEBUG-LOG.md (v1 bugs fixed)
└── legacy/          the original v1 HTML/CSS/JS, kept for reference only
```

## Quick start

Requires Node 22.13+ (built-in SQLite). Tested on Node 24.

```bash
npm install
npm run assets      # generate optimised covers, backgrounds, favicons, OG image (one-off / when assets change)
npm run sitemap     # generate client/public/sitemap.xml + robots.txt
npm run dev         # API on :3000 + Vite on :5173 (Vite proxies /api and /media to the API)
```

Open <http://localhost:5173>. The database is created and seeded automatically on first start.

## Scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start API (`node --watch`) and Vite together |
| `npm run build` | Assets + sitemap + production client build into `client/dist` |
| `npm start` | Serve API **and** the built client from one Express process |
| `npm test` | Server test-suite (30 tests, in-memory DB, no network) |
| `npm run lint` | ESLint (React hooks + React Compiler rules) on the client |
| `npm run seed` | Re-seed playlists/tracks from `server/data/seed/playlists.json` (idempotent) |
| `npm run report -w server` | Print first-party analytics summary (`-- 7` for 7 days) |
| `npm run check` | All launch checks: secrets → contrast → links → perf (needs `npm start` running) |

## Configuration

Copy `server/.env.example` to `server/.env`. The important ones:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public origin (`https://your-domain.com`). Used for canonical/OG URLs, CORS and the CSRF origin check. Also pass it to `npm run sitemap`. |
| `SESSION_SECRET` | Signs the session cookie and anti-spam form tokens. **Required in production.** |
| `ENFORCE_HTTPS` / `TRUST_PROXY` | Redirect http→https + HSTS behind a TLS-terminating proxy (`TRUST_PROXY=1`). |
| `ANALYTICS_PROVIDER` | `first-party` (default, SQLite), `plausible`, `ga4` or `none`. The client reads this from `/api/config`, so the CSP always matches. |

The client has **no secrets and no required env vars** (`client/.env.example`). Everything the browser needs comes from `GET /api/config`.

## Architecture notes

- **Audio** is served from `server/media/music` by `express.static`, which implements HTTP Range requests (seeking works without downloading whole files).
- **Auth**: scrypt password hashes, 256-bit random session tokens stored as SHA-256 hashes, signed `httpOnly` `SameSite=Lax` cookie. State-changing requests need the `X-Requested-With: BeatNest` header and a matching `Origin` (CSRF).
- **Forms**: one zod schema per form in `shared/` validates on the client (blur/submit) and again on the server. Spam protection = honeypot field + server-signed form token with minimum fill time + per-route rate limits.
- **SEO**: the server rewrites `<title>`, description, canonical and Open Graph/Twitter tags per route when serving `index.html` (so link previews work without SSR); the React app keeps them in sync on navigation. Unknown URLs get a real **HTTP 404**.
- **Analytics** are consent-gated. Nothing loads or is sent before the visitor accepts; first-party events contain no IP or user id and are pruned after 90 days.
- **Mini Loop** is saved server-side for members and in `localStorage` for guests (and migrated to the account on sign-up/login).

## Deploying

1. `npm ci && npm run build`
2. Set `NODE_ENV=production`, `SITE_URL`, `SESSION_SECRET`, `ENFORCE_HTTPS=true`, `TRUST_PROXY=1` (or however many proxies sit in front).
3. `npm start` – one process serves the API, the audio and the built client. Put it behind nginx/Caddy/your platform's TLS terminator.
4. Replace the placeholder contact emails in `client/src/pages/PrivacyPage.jsx` and `TermsPage.jsx`, and have the legal pages reviewed.
5. Run `npm run check` against the deployed URL: `CHECK_URL=https://your-domain.com npm run check:links`.

### Native binaries blocked? (Windows Application Control)

`sharp` (image pipeline) ships a native binary that some locked-down Windows machines refuse to load. This repo also installs `@img/sharp-wasm32`, which sharp picks up automatically, so `npm run assets` works either way – just slower on WASM.

## Credits

Covers and recordings belong to their respective artists and rights holders and are included for personal, non-commercial listening.
