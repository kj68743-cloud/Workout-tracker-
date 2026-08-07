import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { todayStr } from '../utils/date.js';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HistoryScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const today = todayStr();

  useEffect(() => {
    api
      .getHistory(42)
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="state-message">Couldn't load history.<br />{error}</div>;
  }
  if (!data) {
    return (
      <div className="state-message">
        <div className="spinner" />
        Loading history…
      </div>
    );
  }

  // Pad the grid so the first entry lands on the correct weekday column.
  const firstDate = new Date(data.entries[0].date + 'T00:00:00');
  const leadingBlanks = firstDate.getDay();
  const cells = [...Array(leadingBlanks).fill(null), ...data.entries];

  const completedCount = data.entries.filter((e) => e.completed).length;

  return (
    <>
      <header className="app-header">
        <div>
          <h1>History</h1>
          <div className="subtitle">Last {data.entries.length} days</div>
        </div>
      </header>

      <div className="progress-card">
        <div className="progress-top">
          <span className="progress-label">Current streak</span>
          <span className="progress-count">🔥 {data.streak}</span>
        </div>
        <div className="progress-top" style={{ marginBottom: 0 }}>
          <span className="progress-label">Workouts logged</span>
          <span className="progress-count">{completedCount}</span>
        </div>
      </div>

      <div className="section-label">Calendar</div>
      <div className="cal-weekday-row">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((entry, i) =>
          entry ? (
            <div
              key={entry.date}
              className={`cal-cell${entry.completed ? ' complete' : ''}${entry.date === today ? ' today' : ''}`}
              title={entry.date}
            >
              <span>{Number(entry.date.slice(8, 10))}</span>
              {entry.completed && <span style={{ fontSize: 9 }}>D{entry.day}</span>}
              {entry.cardio && !entry.completed && <span className="cal-dot" />}
            </div>
          ) : (
            <div key={`blank-${i}`} />
          )
        )}
      </div>

      <div className="legend-row">
        <span>
          <span className="legend-swatch" style={{ background: 'var(--complete-bg)' }} />
          Full day complete
        </span>
        <span>
          <span className="legend-swatch" style={{ background: 'var(--accent)' }} />
          Cardio only
        </span>
      </div>
    </>
  );
}
