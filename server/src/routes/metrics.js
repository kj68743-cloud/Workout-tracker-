import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics ORDER BY date ASC')
    .all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { date, weightKg, waistCm } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  if (weightKg == null && waistCm == null) {
    return res.status(400).json({ error: 'weightKg or waistCm is required' });
  }

  db.prepare(
    `INSERT INTO body_metrics (date, weight_kg, waist_cm) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       weight_kg = COALESCE(excluded.weight_kg, body_metrics.weight_kg),
       waist_cm = COALESCE(excluded.waist_cm, body_metrics.waist_cm)`
  ).run(date, weightKg ?? null, waistCm ?? null);

  const row = db
    .prepare('SELECT id, date, weight_kg AS weightKg, waist_cm AS waistCm FROM body_metrics WHERE date = ?')
    .get(date);
  res.status(201).json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM body_metrics WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
