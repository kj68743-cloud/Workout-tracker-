export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** Flattens the backup payload into one human-readable CSV. */
export function backupToCsv(data) {
  const rows = [['type', 'date', 'day', 'exerciseId', 'setIndex', 'weightKg', 'waistCm', 'value']];

  for (const c of data.setCompletions || []) {
    rows.push(['set_completed', c.date, c.day, c.exerciseId, c.setIndex, '', '', '']);
  }
  for (const c of data.cardioCompletions || []) {
    rows.push(['cardio_completed', c.date, '', '', '', '', '', '']);
  }
  for (const m of data.bodyMetrics || []) {
    rows.push(['body_metric', m.date, '', '', '', m.weightKg ?? '', m.waistCm ?? '', '']);
  }
  for (const e of data.exercises || []) {
    rows.push(['exercise_weight', '', '', e.id, '', '', '', e.weight ?? '']);
  }

  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}
