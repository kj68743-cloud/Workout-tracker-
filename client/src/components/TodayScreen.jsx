import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { todayStr, formatLongDate } from '../utils/date.js';
import DayTabs from './DayTabs.jsx';
import ProgressCard from './ProgressCard.jsx';
import ExerciseCard from './ExerciseCard.jsx';
import CardioCard from './CardioCard.jsx';
import RestTimer from './RestTimer.jsx';

const ACTIVE_DAY_KEY = 'fdst.activeDay';

export default function TodayScreen() {
  const [activeDay, setActiveDay] = useState(() => {
    const saved = Number(localStorage.getItem(ACTIVE_DAY_KEY));
    return saved >= 1 && saved <= 5 ? saved : 1;
  });
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [restActive, setRestActive] = useState(false);
  const restRef = useRef(null);
  const date = todayStr();

  const load = useCallback(async (day) => {
    setError(null);
    try {
      const data = await api.getDay(day, date);
      setPayload(data);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_DAY_KEY, String(activeDay));
    load(activeDay);
  }, [activeDay, load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleToggleSet(exercise, setIndex, completed) {
    // optimistic update
    setPayload((p) => {
      if (!p) return p;
      const exercises = p.exercises.map((e) =>
        e.id === exercise.id
          ? { ...e, completedSets: e.completedSets.map((v, i) => (i === setIndex ? completed : v)) }
          : e
      );
      return { ...p, exercises };
    });

    if (completed) {
      restRef.current?.start(exercise.restSeconds, exercise.name);
    }

    try {
      const updated = await api.toggleSet(activeDay, {
        date,
        exerciseId: exercise.id,
        setIndex,
        completed,
      });
      const wasComplete = payload?.progress?.doneSlots === payload?.progress?.totalSlots;
      setPayload(updated);
      if (!wasComplete && updated.progress.doneSlots === updated.progress.totalSlots) {
        showToast(`🔥 Day ${activeDay} complete — streak ${updated.streak}!`);
      }
    } catch (err) {
      setError(err.message);
      load(activeDay);
    }
  }

  async function handleToggleCardio(completed) {
    setPayload((p) => (p ? { ...p, cardio: { ...p.cardio, completed } } : p));
    try {
      const updated = await api.toggleCardio(activeDay, { date, completed });
      const wasComplete = payload?.progress?.doneSlots === payload?.progress?.totalSlots;
      setPayload(updated);
      if (!wasComplete && updated.progress.doneSlots === updated.progress.totalSlots) {
        showToast(`🔥 Day ${activeDay} complete — streak ${updated.streak}!`);
      }
    } catch (err) {
      setError(err.message);
      load(activeDay);
    }
  }

  async function handleSaveWeight(exerciseId, weight) {
    const result = await api.updateWeight(exerciseId, weight);
    setPayload((p) => {
      if (!p) return p;
      return {
        ...p,
        exercises: p.exercises.map((e) => (e.id === exerciseId ? { ...e, ...result } : e)),
      };
    });
    return result;
  }

  if (error && !payload) {
    return (
      <div className="state-message">
        Couldn't reach the server.
        <br />
        {error}
        <div style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={() => load(activeDay)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="state-message">
        <div className="spinner" />
        Loading today's workout…
      </div>
    );
  }

  const completedDays = new Set();
  if (payload.progress.doneSlots === payload.progress.totalSlots) completedDays.add(activeDay);

  return (
    <>
      <header className="app-header">
        <div>
          <h1>Five-Day Split</h1>
          <div className="subtitle">{formatLongDate(date)}</div>
        </div>
      </header>

      <DayTabs
        days={payload.days}
        activeDay={activeDay}
        onSelect={setActiveDay}
        completedDays={completedDays}
      />

      <ProgressCard
        doneSlots={payload.progress.doneSlots}
        totalSlots={payload.progress.totalSlots}
        streak={payload.streak}
      />

      <div className="section-label">Day {activeDay} exercises</div>
      <div className="exercise-list">
        {payload.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onToggleSet={handleToggleSet}
            onSaveWeight={handleSaveWeight}
          />
        ))}
      </div>

      <div className="section-label">Every day</div>
      <CardioCard cardio={payload.cardio} onToggle={handleToggleCardio} />

      {/* Reserves space so the fixed rest-timer bar never floats on top of
          (and blocks taps on) the cardio toggle above the bottom nav. */}
      {restActive && <div style={{ height: 132 }} aria-hidden="true" />}

      {toast && <div className="toast">{toast}</div>}
      <RestTimer ref={restRef} onActiveChange={setRestActive} />
    </>
  );
}
