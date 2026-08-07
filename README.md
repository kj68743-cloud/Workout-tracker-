# Five-Day Split Tracker — for Komal

A mobile-first workout tracker built for a fixed five-day split. Tap sets to
log them, tap weights to edit and save them, track daily cardio, keep a
streak, and see progress over time — all backed by a real database so data
follows you across devices, not just one browser.

- **Frontend:** React + Vite (`/client`)
- **Backend:** Node/Express + [libSQL](https://turso.tech/libsql) (`/server`, `/api`) — SQLite-compatible; runs against a local file for dev, or a hosted [Turso](https://turso.tech) database in production so the app works on free, stateless hosting.

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
├── client/            Vite + React frontend
│   └── src/
│       ├── components/   UI screens & pieces
│       ├── api.js        Thin fetch wrapper around the backend API
│       └── styles/       Design tokens (dark theme, amber accent)
├── server/            Express + libSQL backend
│   └── src/
│       ├── planData.js   The workout plan (single source of truth)
│       ├── db.js         DB connection (local file or Turso) + schema/seed
│       ├── lib.js        Streak / day-completion logic
│       ├── app.js        The Express app (routes, no listener)
│       ├── index.js      Starts app.js as a long-running process (local/Docker/Fly)
│       └── routes/       /api/day, /api/exercises, /api/history, /api/metrics, /api/export|import
├── api/[...path].js   Vercel serverless entry — wraps the same app.js
├── vercel.json         Deploy config for the recommended all-in-one Vercel setup
├── Dockerfile / fly.toml / render.yaml   Alternative: one always-on host with a real disk (small monthly cost)
└── netlify.toml         Alternative: Netlify for the static frontend only
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

Without any Turso env vars set, the server automatically uses a local
SQLite file at `server/data/tracker.db` (gitignored). Delete that folder
any time to reset all logged data — the exercise plan itself always
reseeds from `planData.js`.

## Deploying (recommended: free, one URL)

This is the path that costs $0/month: the client and API deploy together
as one Vercel project (one URL, no CORS or env-var juggling), and the
database is a free hosted [Turso](https://turso.tech) instance instead of
a local file — which is what lets the compute side run on Vercel's free,
stateless functions without losing data between requests.

**1. Create a free Turso database** (turso.tech → sign up → Create Database,
all in the browser, no CLI needed):

- Pick any name and region.
- Once created, open the database → copy the **connection URL**
  (`libsql://your-db-name-xxxx.turso.io`).
- Create a token for it (Tokens tab → Create Token) and copy it.

**2. Deploy to Vercel:**

- [vercel.com](https://vercel.com) → **Add New → Project** → import
  `kj68743-cloud/Workout-tracker-` from GitHub.
- Leave **Root Directory** as the repo root (the included `vercel.json`
  handles building the client and wiring up `/api`).
- Before deploying, add two environment variables (Project Settings →
  Environment Variables, or the "Environment Variables" step in the import
  wizard):
  ```
  TURSO_DATABASE_URL = libsql://your-db-name-xxxx.turso.io
  TURSO_AUTH_TOKEN   = <the token you copied>
  ```
- Deploy. Vercel gives you a URL like
  `https://workout-tracker-yourname.vercel.app` — that's the live app.
  Open it on your phone and add it to your home screen for an app-like feel.

That's it — no `DATA_DIR`, no `VITE_API_URL`, no second service. The same
Vercel deploy serves the React app *and* the API from the same domain, and
every write goes straight to Turso, so it's already synced across any
device that opens the same URL.

Since Turso and Vercel are both connected to your own accounts, I can't
click through the sign-up/deploy screens for you — but there's no code
left to write; it's just those two dashboards.

## Alternative: single always-on host with a real disk (small cost)

If you'd rather not depend on Turso and are fine with a small monthly
cost (~$7–8/mo), the app also runs as one plain Node process with a local
SQLite file, using the included `Dockerfile`:

- **Render** — `render.yaml` is set up for this (**New → Blueprint**,
  set the web service's plan to **Starter** so it can attach a persistent
  disk — Render's free tier has no disk at all, so this option specifically
  needs the paid plan).
- **Fly.io** — `fly.toml` is set up for this (`fly launch --no-deploy`,
  `fly volumes create tracker_data --size 1`, `fly deploy`). Fly no longer
  has a free allowance, so this also costs a small monthly amount.
- Any VPS / Railway — `npm run build --prefix client`, then
  `npm start --prefix server` with `DATA_DIR` pointed at a persistent path.

In every case here, leave `TURSO_DATABASE_URL` unset — the server falls
back to a local SQLite file automatically.

## Data & backup

Every write goes straight to the database (Turso in the recommended setup,
or a local file in the alternative), so any device pointed at the same
deployed URL sees the same data. As a safety net (and a way to move data
if you ever change hosting), use **More → Export JSON** to download a full
backup, and **More → Import JSON backup** to restore it. CSV export is
also available for a human-readable/spreadsheet copy, but only JSON can be
re-imported.

## Notes on the plan data

Editing weight on an exercise updates it everywhere that exercise appears
(Goblet Squat and Romanian Deadlift each show up on two days, sharing one
weight + personal-best record — set completion is still tracked per day).
"Light-moderate weight" / "light weight" exercises with no fixed starting
number (Seated Cable Fly, Leg Extension, Lying Leg Curl, Cable Overhead
Triceps Extension) start with no saved weight — tap **"set weight"** to log
your first working weight for them.
