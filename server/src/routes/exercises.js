import { Router } from 'express';
import { db } from '../db.js';
import { EXERCISES, DAY_PLAN } from '../planData.js';
import { getExerciseRow } from '../lib.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const daysByExercise = {};
    for (const [day, ids] of Object.entries(DAY_PLAN)) {
      for (const id of ids) {
        daysByExercise[id] = daysByExercise[id] || [];
        daysByExercise[id].push(Number(day));
      }
    }
    const all = await Promise.all(
      Object.keys(EXERCISES).map(async (id) => ({
        ...(await getExerciseRow(id)),
        days: daysByExercise[id] || [],
      }))
    );
    res.json(all);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!EXERCISES[id]) return res.status(404).json({ error: 'Unknown exercise' });
    const { weight } = req.body;
    if (typeof weight !== 'number' || Number.isNaN(weight) || weight < 0) {
      return res.status(400).json({ error: 'weight must be a non-negative number' });
    }

    const currentResult = await db.execute({
      sql: 'SELECT best_weight AS bestWeight FROM exercises WHERE id = ?',
      args: [id],
    });
    const bestWeight = Math.max(weight, currentResult.rows[0]?.bestWeight ?? 0) || weight;

    await db.execute({
      sql: `INSERT INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET weight = excluded.weight,
              best_weight = MAX(COALESCE(exercises.best_weight, 0), excluded.weight)`,
      args: [id, weight, bestWeight],
    });

    res.json(await getExerciseRow(id));
  } catch (err) {
    next(err);
  }
});

export default router;
