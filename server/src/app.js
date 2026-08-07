import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ready } from './db.js';

import dayRouter from './routes/day.js';
import exercisesRouter from './routes/exercises.js';
import historyRouter from './routes/history.js';
import metricsRouter from './routes/metrics.js';
import backupRouter from './routes/backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Make sure tables exist (and the plan is seeded) before any /api route
// runs. Memoized in db.js, so this is a no-op after the first request on a
// warm server/serverless container.
app.use('/api', async (req, res, next) => {
  try {
    await ready();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/day', dayRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/history', historyRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api', backupRouter); // exposes /api/export and /api/import

// Same-origin all-in-one mode: if a built client (client/dist) is present
// next to the server, serve it and let the SPA handle client-side routes.
// This is what the Dockerfile/fly.toml deploy uses. On Vercel the static
// client is served directly by the platform, so this never triggers there.
const clientDist = process.env.CLIENT_DIST_DIR || path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log(`Serving built client from ${clientDist}`);
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
