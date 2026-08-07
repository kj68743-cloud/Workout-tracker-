import { useState } from 'react';
import { todayStr, shiftDate, formatNavDate } from '../utils/date.js';
import DatePickerModal from './DatePickerModal.jsx';

export default function DateNav({ date, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
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

      <button type="button" className="date-nav-picker" onClick={() => setPickerOpen(true)}>
        <span className="date-nav-text">{formatNavDate(date)}</span>
      </button>

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

      {pickerOpen && (
        <DatePickerModal
          date={date}
          onApply={(newDate) => {
            onChange(newDate);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
