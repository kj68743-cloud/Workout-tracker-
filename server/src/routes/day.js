import { Router } from 'express';
import { db } from '../db.js';
import { DAY_PLAN, CARDIO, DAYS } from '../planData.js';
import { getExerciseRow, recomputeDayCompletion, computeStreak, todayStr } from '../lib.js';

const router = Router();

async function buildDayPayload(day, date) {
  const exerciseIds = DAY_PLAN[day] || [];
  const completedResult = await db.execute({
    sql: 'SELECT exercise_id AS exerciseId, set_index AS setIndex FROM set_completions WHERE date = ? AND day = ?',
    args: [date, day],
  });
  const completedSet = new Set(completedResult.rows.map((r) => `${r.exerciseId}:${r.setIndex}`));

  const exercises = await Promise.all(
    exerciseIds.map(async (id) => {
      const ex = await getExerciseRow(id);
      const completedSets = Array.from({ length: ex.sets }, (_, i) =>
        completedSet.has(`${id}:${i}`)
      );
      return { ...ex, completedSets };
    })
  );

  const cardioResult = await db.execute({
    sql: 'SELECT 1 FROM cardio_completions WHERE date = ?',
    args: [date],
  });
  const cardioDone = cardioResult.rows.length > 0;

  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = exercises.reduce((s, e) => s + e.completedSets.filter(Boolean).length, 0);

  return {
    day,
    date,
    days: DAYS,
    exercises,
    cardio: { ...CARDIO, completed: cardioDone },
    progress: {
      doneSets,
      totalSets,
      doneSlots: doneSets + (cardioDone ? 1 : 0),
      totalSlots: totalSets + 1, // +1 slot represents cardio
    },
    streak: await computeStreak(),
  };
}

router.get('/:day', async (req, res, next) => {
  try {
    const day = Number(req.params.day);
    if (!DAYS.includes(day)) return res.status(404).json({ error: 'Unknown day' });
    const date = req.query.date || todayStr();
    res.json(await buildDayPayload(day, date));
  } catch (err) {
    next(err);
  }
});

router.post('/:day/set', async (req, res, next) => {
  try {
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
      await db.execute({
        sql: `INSERT OR IGNORE INTO set_completions (date, day, exercise_id, set_index, completed_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [date, day, exerciseId, setIndex, new Date().toISOString()],
      });
    } else {
      await db.execute({
        sql: 'DELETE FROM set_completions WHERE date = ? AND day = ? AND exercise_id = ? AND set_index = ?',
        args: [date, day, exerciseId, setIndex],
      });
    }

    await recomputeDayCompletion(date, day);
    res.json(await buildDayPayload(day, date));
  } catch (err) {
    next(err);
  }
});

router.post('/:day/cardio', async (req, res, next) => {
  try {
    const day = Number(req.params.day);
    if (!DAYS.includes(day)) return res.status(404).json({ error: 'Unknown day' });
    const { date, completed } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });

    if (completed) {
      await db.execute({
        sql: `INSERT INTO cardio_completions (date, completed_at) VALUES (?, ?)
              ON CONFLICT(date) DO UPDATE SET completed_at = excluded.completed_at`,
        args: [date, new Date().toISOString()],
      });
    } else {
      await db.execute({ sql: 'DELETE FROM cardio_completions WHERE date = ?', args: [date] });
    }

    await recomputeDayCompletion(date, day);
    res.json(await buildDayPayload(day, date));
  } catch (err) {
    next(err);
  }
});

export default router;
