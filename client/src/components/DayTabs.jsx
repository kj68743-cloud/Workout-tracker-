export default function DayTabs({ days, activeDay, onSelect, completedDays }) {
  return (
    <div className="day-tabs">
      {days.map((d) => (
        <button
          key={d}
          type="button"
          className={`day-pill${d === activeDay ? ' active' : ''}`}
          onClick={() => onSelect(d)}
        >
          Day {d}
          {completedDays?.has(d) && <span className="pill-check">✓</span>}
        </button>
      ))}
    </div>
  );
}
