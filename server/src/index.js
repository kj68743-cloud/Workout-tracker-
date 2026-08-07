import express from 'express';
import cors from 'cors';
import './db.js'; // ensure DB is initialized/seeded before routes are hit

import dayRouter from './routes/day.js';
import exercisesRouter from './routes/exercises.js';
import historyRouter from './routes/history.js';
import metricsRouter from './routes/metrics.js';
import backupRouter from './routes/backup.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/day', dayRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/history', historyRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api', backupRouter); // exposes /api/export and /api/import

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Five-Day Split Tracker API listening on port ${PORT}`);
});
