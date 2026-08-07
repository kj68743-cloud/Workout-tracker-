export function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

/** Add (or subtract, with a negative delta) whole days to a YYYY-MM-DD string. */
export function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export function formatLongDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  // Only clutter the header with a year once it's not the current one.
  if (dateStr.slice(0, 4) !== today.slice(0, 4)) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}

/** Compact form for the date-nav bar, which has less room to work with
 *  (arrows + a "Today" button competing for space alongside it). */
export function formatNavDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  const opts = { weekday: 'short', month: 'short', day: 'numeric' };
  if (dateStr.slice(0, 4) !== today.slice(0, 4)) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}
