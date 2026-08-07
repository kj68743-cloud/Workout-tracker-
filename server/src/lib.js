import { db } from './db.js';
import { EXERCISES, DAY_PLAN } from './planData.js';

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Build the exercise metadata for a given day, merged with live weight/PB. */
export function getExerciseRow(id) {
  const meta = EXERCISES[id];
  if (!meta) return null;
  const row = db.prepare('SELECT weight, best_weight FROM exercises WHERE id = ?').get(id);
  const weight = row?.weight ?? null;
  const bestWeight = row?.best_weight ?? null;
  return {
    id,
    name: meta.name,
    sets: meta.sets,
    repsLabel: meta.repsLabel,
    weightLabel: meta.weightLabel,
    unit: meta.unit,
    isBodyweight: meta.isBodyweight,
    isVariable: meta.isVariable,
    restSeconds: meta.restSeconds,
    weight,
    bestWeight,
    isPB: weight != null && bestWeight != null && weight >= bestWeight && weight > 0,
  };
}

export function totalSetsForDay(day) {
  return (DAY_PLAN[day] || []).reduce((sum, id) => sum + EXERCISES[id].sets, 0);
}

/**
 * Recompute whether `date`+`day` is fully complete (every set for every
 * exercise on that day, plus cardio) and keep day_completions in sync.
 */
export function recomputeDayCompletion(date, day) {
  const exerciseIds = DAY_PLAN[day] || [];
  const totalSets = totalSetsForDay(day);
  const doneSets = db
    .prepare(
      `SELECT COUNT(*) AS n FROM set_completions WHERE date = ? AND day = ? AND exercise_id IN (${exerciseIds
        .map(() => '?')
        .join(',')})`
    )
    .get(date, day, ...exerciseIds).n;
  const cardioDone = !!db.prepare('SELECT 1 FROM cardio_completions WHERE date = ?').get(date);
  const complete = totalSets > 0 && doneSets >= totalSets && cardioDone;

  if (complete) {
    db.prepare(
      `INSERT INTO day_completions (date, day, completed_at) VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET day = excluded.day, completed_at = excluded.completed_at`
    ).run(date, day, new Date().toISOString());
  } else {
    // Only clear it if it was this same day recorded as complete — if the
    // date belongs to a different day's completion, leave it alone.
    const existing = db.prepare('SELECT day FROM day_completions WHERE date = ?').get(date);
    if (existing && existing.day === day) {
      db.prepare('DELETE FROM day_completions WHERE date = ?').run(date);
    }
  }
  return { complete, doneSets, totalSets, cardioDone };
}

export function computeStreak() {
  const rows = db.prepare('SELECT date FROM day_completions').all();
  const dateSet = new Set(rows.map((r) => r.date));
  let cursor = todayStr();
  if (!dateSet.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!dateSet.has(cursor)) return 0;
  }
  let count = 0;
  while (dateSet.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}
