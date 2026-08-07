import { Router } from 'express';
import { db } from '../db.js';
import { recomputeDayCompletion } from '../lib.js';
import { DAYS } from '../planData.js';

const router = Router();

const SCHEMA_VERSION = 1;

router.get('/export', async (req, res, next) => {
  try {
    const [exercisesR, setCompletionsR, cardioCompletionsR, dayCompletionsR, bodyMetricsR] =
      await Promise.all([
        db.execute('SELECT id, weight, best_weight AS bestWeight FROM exercises'),
        db.execute(
          'SELECT date, day, exercise_id AS exerciseId, set_index AS setIndex, completed_at AS completedAt FROM set_completions'
        ),
        db.execute('SELECT date, completed_at AS completedAt FROM cardio_completions'),
        db.execute('SELECT date, day, completed_at AS completedAt FROM day_completions'),
        db.execute('SELECT date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics'),
      ]);

    const payload = {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      exercises: exercisesR.rows,
      setCompletions: setCompletionsR.rows,
      cardioCompletions: cardioCompletionsR.rows,
      dayCompletions: dayCompletionsR.rows,
      bodyMetrics: bodyMetricsR.rows,
    };

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="five-day-split-backup-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.post('/import', async (req, res, next) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid backup file' });
  }

  const affectedDays = new Set(); // `${date}|${day}` pairs to recheck afterwards

  try {
    const tx = await db.transaction('write');
    try {
      // Wipe logged data (but keep the fixed exercise plan definitions/table).
      await tx.execute('DELETE FROM set_completions');
      await tx.execute('DELETE FROM cardio_completions');
      await tx.execute('DELETE FROM day_completions');
      await tx.execute('DELETE FROM body_metrics');

      if (Array.isArray(data.exercises)) {
        for (const e of data.exercises) {
          if (!e?.id) continue;
          await tx.execute({
            sql: `INSERT INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET weight = excluded.weight, best_weight = excluded.best_weight`,
            args: [e.id, e.weight ?? null, e.bestWeight ?? e.weight ?? null],
          });
        }
      }

      if (Array.isArray(data.setCompletions)) {
        for (const c of data.setCompletions) {
          if (!c?.date || c.day == null || !c.exerciseId || c.setIndex == null) continue;
          await tx.execute({
            sql: `INSERT OR IGNORE INTO set_completions (date, day, exercise_id, set_index, completed_at) VALUES (?, ?, ?, ?, ?)`,
            args: [c.date, c.day, c.exerciseId, c.setIndex, c.completedAt || new Date().toISOString()],
          });
          affectedDays.add(`${c.date}|${c.day}`);
        }
      }

      if (Array.isArray(data.cardioCompletions)) {
        for (const c of data.cardioCompletions) {
          if (!c?.date) continue;
          await tx.execute({
            sql: `INSERT INTO cardio_completions (date, completed_at) VALUES (?, ?)
                  ON CONFLICT(date) DO UPDATE SET completed_at = excluded.completed_at`,
            args: [c.date, c.completedAt || new Date().toISOString()],
          });
          for (const day of DAYS) affectedDays.add(`${c.date}|${day}`);
        }
      }

      if (Array.isArray(data.bodyMetrics)) {
        for (const m of data.bodyMetrics) {
          if (!m?.date) continue;
          await tx.execute({
            sql: `INSERT INTO body_metrics (date, weight_kg, waist_cm) VALUES (?, ?, ?)
                  ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, waist_cm = excluded.waist_cm`,
            args: [m.date, m.weightKg ?? null, m.waistCm ?? null],
          });
        }
      }

      // Prefer the imported day_completions verbatim if present, otherwise
      // recompute from the sets/cardio we just restored (below, post-commit).
      if (Array.isArray(data.dayCompletions) && data.dayCompletions.length) {
        for (const d of data.dayCompletions) {
          if (!d?.date || d.day == null) continue;
          await tx.execute({
            sql: `INSERT INTO day_completions (date, day, completed_at) VALUES (?, ?, ?)
                  ON CONFLICT(date) DO UPDATE SET day = excluded.day, completed_at = excluded.completed_at`,
            args: [d.date, d.day, d.completedAt || new Date().toISOString()],
          });
        }
        affectedDays.clear();
      }

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    for (const key of affectedDays) {
      const [date, day] = key.split('|');
      await recomputeDayCompletion(date, Number(day));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Import failed', err);
    res.status(400).json({ error: 'Import failed: ' + err.message });
  }
});

export default router;
