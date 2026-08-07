import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXERCISES } from './planData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DB file lives outside the source tree so it survives redeploys where only
// the code changes, and can be pointed anywhere via DATA_DIR (useful for a
// persistent volume on a host like Render/Railway/Fly).
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'tracker.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    weight REAL,
    best_weight REAL
  );

  CREATE TABLE IF NOT EXISTS set_completions (
    date TEXT NOT NULL,
    day INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (date, day, exercise_id, set_index)
  );

  CREATE TABLE IF NOT EXISTS cardio_completions (
    date TEXT PRIMARY KEY,
    completed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS day_completions (
    date TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight_kg REAL,
    waist_cm REAL
  );
`);

// Seed exercises table with starting weights the first time each exercise id
// is seen. Existing rows (and any weight the user has already saved) are
// left untouched, so re-deploys never clobber logged progress.
const insertIfMissing = db.prepare(
  `INSERT OR IGNORE INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)`
);
const seedAll = db.transaction(() => {
  for (const [id, meta] of Object.entries(EXERCISES)) {
    insertIfMissing.run(id, meta.startingWeight, meta.startingWeight);
  }
});
seedAll();

export default db;
