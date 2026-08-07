import { Router } from 'express';
import { db } from '../db.js';
import { DAY_PLAN, CARDIO, DAYS } from '../planData.js';
import { getExerciseRow, recomputeDayCompletion, computeStreak, todayStr } from '../lib.js';

const router = Router();

function buildDayPayload(day, date) {
  const exerciseIds = DAY_PLAN[day] || [];
  const completedRows = db
    .prepare('SELECT exercise_id, set_index FROM set_completions WHERE date = ? AND day = ?')
    .all(date, day);
  const completedSet = new Set(completedRows.map((r) => `${r.exercise_id}:${r.set_index}`));

  const exercises = exerciseIds.map((id) => {
    const ex = getExerciseRow(id);
    const completedSets = Array.from({ length: ex.sets }, (_, i) =>
      completedSet.has(`${id}:${i}`)
    );
    return { ...ex, completedSets };
  });

  const cardioDone = !!db.prepare('SELECT 1 FROM cardio_completions WHERE date = ?').get(date);
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = exercises.reduce(
    (s, e) => s + e.completedSets.filter(Boolean).length,
    0
  );

  return {
    day,
    date,
    days: DAYS,
    exercises,
    cardio: { ...CARDIO, completed: cardioDone },
    progress: {
      doneSets,
      totalSets,
      // "Slots" = exercise sets plus one slot for cardio, which is what the
      // progress bar and day-complete checks are driven by.
      doneSlots: doneSets + (cardioDone ? 1 : 0),
      totalSlots: totalSets + 1,
    },
    streak: computeStreak(),
  };
}

router.get('/:day', (req, res) => {
  const day = Number(req.params.day);
  if (!DAYS.includes(day)) return res.status(404).json({ error: 'Unknown day' });
  const date = req.query.date || todayStr();
  res.json(buildDayPayload(day, date));
});

router.post('/:day/set', (req, res) => {
  const day = Number(req.params.day);
  if (!DAYS.includes(day)) return res.status(404).json({ error: 'Unknown day' });
  const { date, exerciseId, setIndex, completed } = req.body;
  if (!date || !exerciseId || setIndex == null) {
    return res.status(400).json({ error: 'date, exerciseId and setIndex are required' });
  }
  if (!(DAY_PLAN[day] || []).includes(exerciseId)) {
    return res.status(400).json({ error: 'Exercise does not belong to this day' });
  }

  if (completed) {
    db.prepare(
      `INSERT OR IGNORE INTO set_completions (date, day, exercise_id, set_index, completed_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(date, day, exerciseId, setIndex, new Date().toISOString());
  } else {
    db.prepare(
      'DELETE FROM set_completions WHERE date = ? AND day = ? AND exercise_id = ? AND set_index = ?'
    ).run(date, day, exerciseId, setIndex);
  }

  recomputeDayCompletion(date, day);
  res.json(buildDayPayload(day, date));
});

router.post('/:day/cardio', (req, res) => {
  const day = Number(req.params.day);
  if (!DAYS.includes(day)) return res.status(404).json({ error: 'Unknown day' });
  const { date, completed } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });

  if (completed) {
    db.prepare(
      `INSERT INTO cardio_completions (date, completed_at) VALUES (?, ?)
       ON CONFLICT(date) DO UPDATE SET completed_at = excluded.completed_at`
    ).run(date, new Date().toISOString());
  } else {
    db.prepare('DELETE FROM cardio_completions WHERE date = ?').run(date);
  }

  recomputeDayCompletion(date, day);
  res.json(buildDayPayload(day, date));
});

export default router;
