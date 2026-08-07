// All API calls go through here. In dev, Vite proxies /api to the local
// Express server (see vite.config.js). In production, set VITE_API_URL to
// point at wherever the backend is actually hosted (see README).
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request('/health'),

  getDay: (day, date) => request(`/day/${day}?date=${date}`),
  toggleSet: (day, { date, exerciseId, setIndex, completed }) =>
    request(`/day/${day}/set`, {
      method: 'POST',
      body: JSON.stringify({ date, exerciseId, setIndex, completed }),
    }),
  toggleCardio: (day, { date, completed }) =>
    request(`/day/${day}/cardio`, {
      method: 'POST',
      body: JSON.stringify({ date, completed }),
    }),

  getExercises: () => request('/exercises'),
  updateWeight: (id, weight) =>
    request(`/exercises/${id}`, { method: 'PATCH', body: JSON.stringify({ weight }) }),

  getHistory: (days = 42) => request(`/history?days=${days}`),

  getMetrics: () => request('/metrics'),
  addMetric: (entry) => request('/metrics', { method: 'POST', body: JSON.stringify(entry) }),
  deleteMetric: (id) => request(`/metrics/${id}`, { method: 'DELETE' }),

  exportData: () => request('/export'),
  importData: (data) => request('/import', { method: 'POST', body: JSON.stringify(data) }),
};

export const API_BASE = BASE;
