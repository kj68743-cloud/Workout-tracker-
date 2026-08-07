import { todayStr, shiftDate, formatLongDate } from '../utils/date.js';

export default function DateNav({ date, onChange }) {
  const isToday = date === todayStr();

  return (
    <div className="date-nav">
      <button
        type="button"
        className="date-nav-arrow"
        aria-label="Previous day"
        onClick={() => onChange(shiftDate(date, -1))}
      >
        ‹
      </button>

      <label className="date-nav-picker">
        <span className="date-nav-text">{formatLongDate(date)}</span>
        <input
          type="date"
          className="date-nav-input"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label="Choose a date"
        />
      </label>

      <button
        type="button"
        className="date-nav-arrow"
        aria-label="Next day"
        onClick={() => onChange(shiftDate(date, 1))}
      >
        ›
      </button>

      {!isToday && (
        <button type="button" className="date-nav-today" onClick={() => onChange(todayStr())}>
          Today
        </button>
      )}
    </div>
  );
}
