import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayStr, formatShortDate } from '../utils/date.js';
import LineChart from './LineChart.jsx';

export default function BodyScreen() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .getMetrics()
      .then(setEntries)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!weightKg && !waistCm) return;
    setSaving(true);
    try {
      await api.addMetric({
        date: todayStr(),
        weightKg: weightKg ? parseFloat(weightKg) : null,
        waistCm: waistCm ? parseFloat(waistCm) : null,
      });
      setWeightKg('');
      setWaistCm('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const weightPoints = (entries || [])
    .filter((e) => e.weightKg != null)
    .map((e) => ({ x: e.date, y: e.weightKg }));
  const waistPoints = (entries || [])
    .filter((e) => e.waistCm != null)
    .map((e) => ({ x: e.date, y: e.waistCm }));

  return (
    <>
      <header className="app-header">
        <div>
          <h1>Body Log</h1>
          <div className="subtitle">Weekly weight &amp; waist tracking</div>
        </div>
      </header>

      <form className="metric-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="weightKg">Body weight (kg)</label>
            <input
              id="weightKg"
              inputMode="decimal"
              placeholder="e.g. 58.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="waistCm">Waist (cm)</label>
            <input
              id="waistCm"
              inputMode="decimal"
              placeholder="e.g. 71"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : `Log entry for ${formatShortDate(todayStr())}`}
        </button>
      </form>

      {error && <div className="state-message">{error}</div>}

      <div className="chart-card">
        <div className="chart-title">Body weight (kg)</div>
        <LineChart points={weightPoints} unit="kg" color="#ffb020" />
      </div>

      <div className="chart-card">
        <div className="chart-title">Waist (cm)</div>
        <LineChart points={waistPoints} unit="cm" color="#bfe8c9" />
      </div>

      <div className="section-label">Log</div>
      <div className="settings-section" style={{ padding: 0 }}>
        {entries && entries.length === 0 && (
          <div className="metrics-empty">No entries yet.</div>
        )}
        {entries &&
          [...entries]
            .reverse()
            .map((e) => (
              <div className="metric-log-row" key={e.id}>
                <span className="metric-log-date">{formatShortDate(e.date)}</span>
                <span className="metric-log-values">
                  {e.weightKg != null ? `${e.weightKg} kg` : '—'}
                  {'  '}
                  {e.waistCm != null ? `${e.waistCm} cm` : ''}
                </span>
              </div>
            ))}
      </div>
    </>
  );
}
