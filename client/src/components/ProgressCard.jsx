export default function ProgressCard({ doneSlots, totalSlots, streak }) {
  const pct = totalSlots > 0 ? Math.min(100, Math.round((doneSlots / totalSlots) * 100)) : 0;
  return (
    <div className="progress-card">
      <div className="progress-top">
        <span className="progress-label">Today's progress</span>
        <span className="progress-count">
          {doneSlots}/{totalSlots}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="streak-row">
        <span className="streak-flame">🔥</span>
        <span>
          Streak: <span className="streak-count">{streak}</span> {streak === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  );
}
