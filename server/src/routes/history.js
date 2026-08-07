import { Router } from 'express';
import { db } from '../db.js';
import { computeStreak, todayStr } from '../lib.js';

const router = Router();

// Calendar data for the past N days (default 42 ~ 6 weeks).
router.get('/', (req, res) => {
  const days = Math.min(Number(req.query.days) || 42, 365);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const completions = db
    .prepare('SELECT date, day FROM day_completions WHERE date >= ? ORDER BY date ASC')
    .all(startStr);
  const cardio = db
    .prepare('SELECT date FROM cardio_completions WHERE date >= ? ORDER BY date ASC')
    .all(startStr);

  const completedByDate = Object.fromEntries(completions.map((r) => [r.date, r.day]));
  const cardioSet = new Set(cardio.map((r) => r.date));

  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      day: completedByDate[dateStr] ?? null,
      completed: dateStr in completedByDate,
      cardio: cardioSet.has(dateStr),
    });
  }

  res.json({ from: startStr, to: todayStr(), entries: result, streak: computeStreak() });
});

export default router;
