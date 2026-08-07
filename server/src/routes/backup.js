import { Router } from 'express';
import { db } from '../db.js';
import { recomputeDayCompletion } from '../lib.js';
import { DAY_PLAN, DAYS } from '../planData.js';

const router = Router();

const SCHEMA_VERSION = 1;

router.get('/export', (req, res) => {
  const exercises = db.prepare('SELECT id, weight, best_weight AS bestWeight FROM exercises').all();
  const setCompletions = db
    .prepare('SELECT date, day, exercise_id AS exerciseId, set_index AS setIndex, completed_at AS completedAt FROM set_completions')
    .all();
  const cardioCompletions = db
    .prepare('SELECT date, completed_at AS completedAt FROM cardio_completions')
    .all();
  const dayCompletions = db
    .prepare('SELECT date, day, completed_at AS completedAt FROM day_completions')
    .all();
  const bodyMetrics = db
    .prepare('SELECT date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics')
    .all();

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    setCompletions,
    cardioCompletions,
    dayCompletions,
    bodyMetrics,
  };

  res.setHeader('Content-Disposition', `attachment; filename="five-day-split-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(payload);
});

router.post('/import', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid backup file' });
  }

  const affectedDays = new Set(); // `${date}|${day}` pairs to recheck afterwards

  const run = db.transaction(() => {
    // Wipe logged data (but keep the fixed exercise plan definitions/table).
    db.prepare('DELETE FROM set_completions').run();
    db.prepare('DELETE FROM cardio_completions').run();
    db.prepare('DELETE FROM day_completions').run();
    db.prepare('DELETE FROM body_metrics').run();

    if (Array.isArray(data.exercises)) {
      const stmt = db.prepare(
        `INSERT INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET weight = excluded.weight, best_weight = excluded.best_weight`
      );
      for (const e of data.exercises) {
        if (!e?.id) continue;
        stmt.run(e.id, e.weight ?? null, e.bestWeight ?? e.weight ?? null);
      }
    }

    if (Array.isArray(data.setCompletions)) {
      const stmt = db.prepare(
        `INSERT OR IGNORE INTO set_completions (date, day, exercise_id, set_index, completed_at) VALUES (?, ?, ?, ?, ?)`
      );
      for (const c of data.setCompletions) {
        if (!c?.date || c.day == null || !c.exerciseId || c.setIndex == null) continue;
        stmt.run(c.date, c.day, c.exerciseId, c.setIndex, c.completedAt || new Date().toISOString());
        affectedDays.add(`${c.date}|${c.day}`);
      }
    }

    if (Array.isArray(data.cardioCompletions)) {
      const stmt = db.prepare(
        `INSERT INTO cardio_completions (date, completed_at) VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET completed_at = excluded.completed_at`
      );
      for (const c of data.cardioCompletions) {
        if (!c?.date) continue;
        stmt.run(c.date, c.completedAt || new Date().toISOString());
        for (const day of DAYS) affectedDays.add(`${c.date}|${day}`);
      }
    }

    if (Array.isArray(data.bodyMetrics)) {
      const stmt = db.prepare(
        `INSERT INTO body_metrics (date, weight_kg, waist_cm) VALUES (?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, waist_cm = excluded.waist_cm`
      );
      for (const m of data.bodyMetrics) {
        if (!m?.date) continue;
        stmt.run(m.date, m.weightKg ?? null, m.waistCm ?? null);
      }
    }

    // Prefer the imported day_completions verbatim if present, otherwise
    // recompute from the sets/cardio we just restored.
    if (Array.isArray(data.dayCompletions) && data.dayCompletions.length) {
      const stmt = db.prepare(
        `INSERT INTO day_completions (date, day, completed_at) VALUES (?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET day = excluded.day, completed_at = excluded.completed_at`
      );
      for (const d of data.dayCompletions) {
        if (!d?.date || d.day == null) continue;
        stmt.run(d.date, d.day, d.completedAt || new Date().toISOString());
      }
    } else {
      for (const key of affectedDays) {
        const [date, day] = key.split('|');
        recomputeDayCompletion(date, Number(day));
      }
    }
  });

  try {
    run();
  } catch (err) {
    console.error('Import failed', err);
    return res.status(400).json({ error: 'Import failed: ' + err.message });
  }

  res.json({ ok: true });
});

export default router;
