import { Router } from 'express';
import { db } from '../db.js';
import { EXERCISES, DAY_PLAN } from '../planData.js';
import { getExerciseRow } from '../lib.js';

const router = Router();

router.get('/', (req, res) => {
  const daysByExercise = {};
  for (const [day, ids] of Object.entries(DAY_PLAN)) {
    for (const id of ids) {
      daysByExercise[id] = daysByExercise[id] || [];
      daysByExercise[id].push(Number(day));
    }
  }
  const all = Object.keys(EXERCISES).map((id) => ({
    ...getExerciseRow(id),
    days: daysByExercise[id] || [],
  }));
  res.json(all);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  if (!EXERCISES[id]) return res.status(404).json({ error: 'Unknown exercise' });
  const { weight } = req.body;
  if (typeof weight !== 'number' || Number.isNaN(weight) || weight < 0) {
    return res.status(400).json({ error: 'weight must be a non-negative number' });
  }

  const current = db.prepare('SELECT best_weight FROM exercises WHERE id = ?').get(id);
  const bestWeight = Math.max(weight, current?.best_weight ?? 0) || weight;

  db.prepare(
    `INSERT INTO exercises (id, weight, best_weight) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET weight = excluded.weight,
       best_weight = MAX(COALESCE(exercises.best_weight, 0), excluded.weight)`
  ).run(id, weight, bestWeight);

  res.json(getExerciseRow(id));
});

export default router;
