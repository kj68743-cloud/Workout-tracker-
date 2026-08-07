import { useEffect, useMemo, useState } from 'react';
import { todayStr, formatLongDate } from '../utils/date.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-indexed here
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function DatePickerModal({ date, onApply, onClose }) {
  const [y, m, d] = date.split('-').map(Number);
  // Year is chosen first and stays fixed while month/day are adjusted —
  // it only changes when explicitly reselected.
  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m);
  const [day, setDay] = useState(d);

  const maxDay = daysInMonth(year, month);
  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [maxDay, day]);

  const yearOptions = useMemo(() => {
    const thisYear = Number(todayStr().slice(0, 4));
    const years = [];
    for (let yr = thisYear - 10; yr <= thisYear + 5; yr++) years.push(yr);
    if (!years.includes(year)) years.unshift(year); // keep an out-of-range year selectable if already set
    return years.sort((a, b) => a - b);
  }, [year]);

  const resultDate = `${year}-${pad(month)}-${pad(Math.min(day, maxDay))}`;

  function handleApply() {
    onApply(resultDate);
  }

  return (
    <div className="date-modal-backdrop" onClick={onClose}>
      <div className="date-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="date-modal-title">Choose a date</div>

        <div className="date-modal-fields">
          <div className="date-modal-field">
            <label htmlFor="dm-year">Year</label>
            <select id="dm-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="date-modal-field">
            <label htmlFor="dm-month">Month</label>
            <select id="dm-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="date-modal-field date-modal-field-day">
            <label htmlFor="dm-day">Day</label>
            <select id="dm-day" value={Math.min(day, maxDay)} onChange={(e) => setDay(Number(e.target.value))}>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((dd) => (
                <option key={dd} value={dd}>
                  {dd}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="date-modal-preview">{formatLongDate(resultDate)}</div>

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleApply}>
            Go to this date
          </button>
        </div>
      </div>
    </div>
  );
}
