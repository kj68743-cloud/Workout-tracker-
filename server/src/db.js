import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXERCISES } from './planData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Two modes, picked automatically:
//  - TURSO_DATABASE_URL set  -> connect to a hosted Turso (libSQL) database.
//    This is what makes the app work on stateless/serverless compute
//    (Vercel functions, Render free tier, etc.) since the data lives
//    off-box instead of on a local disk that may not persist.
//  - otherwise               -> a local SQLite file under DATA_DIR (or
//    ./data next to the server), same as plain SQLite for local dev.
const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let clientConfig;
if (remoteUrl) {
  clientConfig = { url: remoteUrl, authToken };
} else {
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  clientConfig = { url: `file:${path.join(dataDir, 'tracker.db')}` };
}

export const db = createClient(clientConfig);

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    weight REAL,
    best_weight REAL
  )`,
  `CREATE TABLE IF NOT EXISTS set_completions (
    date TEXT NOT NULL,
    day INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (date, day, exercise_id, set_index)
  )`,
  `CREATE TABLE IF NOT EXISTS cardio_completions (
    date TEXT PRIMARY KEY,
    completed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS day_completions (
    date TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight_kg REAL,
    waist_cm REAL
  )`,
];

// Memoized so cold-start serverless invocations only pay the migrate+seed
// cost once per warm container, and concurrent requests share one promise
// instead of racing each other through table creation.
let readyPromise = null;

export function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await db.batch(SCHEMA_STATEMENTS, 'write');

      // Seed exercises the first time each id is seen. Existing rows (and
      // any weight the user already saved) are left untouched via
      // INSERT OR IGNORE, so re-deploys never clobber logged progress.
      const seedStatements = Object.entries(EXERCISES).map(([id, meta]) => ({
        sql: 'INSERT OR IGNORE INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)',
        args: [id, meta.startingWeight, meta.startingWeight],
      }));
      if (seedStatements.length) await db.batch(seedStatements, 'write');
    })();
  }
  return readyPromise;
}

export default db;
