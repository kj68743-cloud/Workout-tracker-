import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await db.execute(
      'SELECT id, date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics ORDER BY date ASC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { date, weightKg, waistCm } = req.body;
    if (!date) return res.status(400).json({ error: 'date is required' });
    if (weightKg == null && waistCm == null) {
      return res.status(400).json({ error: 'weightKg or waistCm is required' });
    }

    await db.execute({
      sql: `INSERT INTO body_metrics (date, weight_kg, waist_cm) VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              weight_kg = COALESCE(excluded.weight_kg, body_metrics.weight_kg),
              waist_cm = COALESCE(excluded.waist_cm, body_metrics.waist_cm)`,
      args: [date, weightKg ?? null, waistCm ?? null],
    });

    const result = await db.execute({
      sql: 'SELECT id, date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics WHERE date = ?',
      args: [date],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.execute({ sql: 'DELETE FROM body_metrics WHERE id = ?', args: [req.params.id] });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
