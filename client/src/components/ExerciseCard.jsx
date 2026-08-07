import { useState } from 'react';

export default function ExerciseCard({ exercise, onToggleSet, onSaveWeight }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [justPB, setJustPB] = useState(false);

  const allDone = exercise.completedSets.every(Boolean);

  function startEdit() {
    if (exercise.isBodyweight) return;
    setDraft(exercise.weight != null ? String(exercise.weight) : '');
    setEditing(true);
  }

  async function saveEdit() {
    const value = parseFloat(draft);
    setEditing(false);
    if (Number.isNaN(value) || value < 0) return;
    const wasPB = exercise.isPB && exercise.weight === exercise.bestWeight;
    const result = await onSaveWeight(exercise.id, value);
    if (result?.isPB && (result.bestWeight ?? 0) <= value && !wasPB) {
      setJustPB(true);
      setTimeout(() => setJustPB(false), 2200);
    } else if (result?.weight >= (exercise.bestWeight ?? 0) && result.weight > 0) {
      setJustPB(true);
      setTimeout(() => setJustPB(false), 2200);
    }
  }

  return (
    <div className={`exercise-card${allDone ? ' all-done' : ''}`}>
      <div className="exercise-top">
        <div>
          <div className="exercise-name">{exercise.name}</div>
          <div className="exercise-meta">
            {exercise.sets} sets &times; {exercise.repsLabel}
          </div>
        </div>

        <div className="exercise-weight-wrap">
          {exercise.isBodyweight ? (
            <div className="exercise-meta">Bodyweight</div>
          ) : editing ? (
            <input
              autoFocus
              className="weight-edit-input"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
          ) : (
            <button type="button" className="weight-btn" onClick={startEdit}>
              {exercise.weight != null ? (
                <>
                  {exercise.weight}
                  <span className="weight-unit">{exercise.unit}</span>
                </>
              ) : (
                <span className="weight-unit" style={{ color: 'var(--accent)' }}>
                  set weight
                </span>
              )}
            </button>
          )}
          {(exercise.isPB || justPB) && exercise.weight ? (
            <div className={`pb-badge${justPB ? ' celebrate-pop' : ''}`}>🏆 PB</div>
          ) : (
            <div className="exercise-meta" style={{ fontSize: 11 }}>
              {exercise.weightLabel}
            </div>
          )}
        </div>
      </div>

      <div className="set-circles">
        {exercise.completedSets.map((done, i) => (
          <button
            key={i}
            type="button"
            className={`set-circle${done ? ' done' : ''}`}
            aria-label={`Set ${i + 1} ${done ? 'complete' : 'incomplete'}`}
            onClick={() => onToggleSet(exercise, i, !done)}
          >
            {done ? '✓' : i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
