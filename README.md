# Five-Day Split Tracker — for Komal

A mobile-first workout tracker built for a fixed five-day split. Tap sets to
log them, tap weights to edit and save them, track daily cardio, keep a
streak, and see progress over time — all backed by a real database so data
follows you across devices, not just one browser.

- **Frontend:** React + Vite (`/client`)
- **Backend:** Node/Express + SQLite via `better-sqlite3` (`/server`)

## Features

- Day 1–5 pill navigation, tap-to-complete set circles, tap-to-edit weights
  that persist and carry over anywhere that exercise appears (e.g. Goblet
  Squat is the same exercise/weight on Day 1 and Day 5).
- Daily progress bar (sets + cardio) and a streak counter.
- Auto-starting rest timer (60–90s, tuned per exercise) with a beep +
  vibration when it ends.
- Personal-best tracking — a 🏆 badge appears the moment a logged weight
  matches or beats your all-time best for that exercise.
- History screen with a calendar of completed days over the past weeks.
- Body log — weekly body weight (kg) + waist (cm) entries with line charts.
- Export your data as JSON (full backup, re-importable) or CSV, and restore
  from a JSON backup.
- One-time onboarding screen explaining the basics.

The exact exercises, sets, reps, and starting weights are defined once, in
`server/src/planData.js`, and served to the client over the API — nothing
about the plan is hardcoded twice.

## Project structure

```
.
├── client/           Vite + React frontend
│   └── src/
│       ├── components/   UI screens & pieces
│       ├── api.js        Thin fetch wrapper around the backend API
│       └── styles/       Design tokens (dark theme, amber accent)
├── server/           Express + SQLite backend
│   └── src/
│       ├── planData.js   The workout plan (single source of truth)
│       ├── db.js         SQLite schema + seeding
│       ├── lib.js        Streak / day-completion logic
│       └── routes/       /api/day, /api/exercises, /api/history, /api/metrics, /api/export|import
├── render.yaml        Backend deploy config (Render)
├── netlify.toml        Frontend deploy config (Netlify)
└── client/vercel.json   Frontend deploy config (Vercel)
```

## Local development

Requires Node 18+.

```bash
npm run install:all   # installs both server/ and client/ dependencies
npm run dev            # runs the API on :4000 and the Vite dev server on :5173
```

Open http://localhost:5173 — Vite proxies `/api/*` to the local Express
server, so the client just calls same-origin paths in dev.

Run them separately if you'd rather:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

The SQLite file is created automatically at `server/data/tracker.db` on
first run (gitignored). Delete that folder any time to reset all logged
data — the exercise plan itself always reseeds from `planData.js`.

## Deploying

The frontend (static) and backend (needs persistent storage) deploy
separately.

### 1. Backend — Render (or Railway / Fly.io)

SQLite needs a real disk, which rules out Vercel/Netlify serverless
functions (their filesystem is ephemeral). Render's free tier gives you a
small persistent disk, which is what `render.yaml` is set up for:

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New → Blueprint**, point it at the
   repo. It reads `render.yaml` and provisions a web service with a 1GB
   disk mounted at `/data`.
3. Note the resulting URL, e.g. `https://five-day-split-tracker-api.onrender.com`.

Railway or Fly.io work the same way — install deps in `server/`, run
`npm start`, mount a persistent volume, and set `DATA_DIR` to point at it.

### 2. Frontend — Vercel or Netlify

**Vercel:** New Project → import the repo → set **Root Directory** to
`client` (the framework preset "Vite" auto-fills the rest, or use the
included `client/vercel.json`). Add an environment variable:

```
VITE_API_URL=https://<your-backend-url>/api
```

**Netlify:** New site from Git → the root `netlify.toml` already points
Netlify at `client/` with the right build/publish paths. Add the same
`VITE_API_URL` environment variable in Site settings → Environment.

Without `VITE_API_URL` set, the client calls same-origin `/api/...`, which
only works when a proxy/dev server is in front of it — always set it for a
production deploy.

### All-in-one alternative

If you'd rather not run two services, the whole app (client + server) can
run as a single Node process behind any host that gives you a persistent
disk (Railway, Fly.io, a small VPS, etc.) — run `npm run build` in
`client/`, have Express serve `client/dist` as static files, and skip
`VITE_API_URL` entirely since everything's same-origin. That's a small,
optional change to `server/src/index.js` if you want it later.

## Data & backup

Every write goes straight to SQLite on the backend, so any device pointed
at the same API URL sees the same data. As a safety net (and a way to move
data between a fresh device or a redeployed backend), use **More → Export
JSON** to download a full backup, and **More → Import JSON backup** to
restore it. CSV export is also available for a human-readable/spreadsheet
copy, but only JSON can be re-imported.

## Notes on the plan data

Editing weight on an exercise updates it everywhere that exercise appears
(Goblet Squat and Romanian Deadlift each show up on two days, sharing one
weight + personal-best record — set completion is still tracked per day).
"Light-moderate weight" / "light weight" exercises with no fixed starting
number (Seated Cable Fly, Leg Extension, Lying Leg Curl, Cable Overhead
Triceps Extension) start with no saved weight — tap **"set weight"** to log
your first working weight for them.
