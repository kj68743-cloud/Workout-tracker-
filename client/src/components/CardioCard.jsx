export default function CardioCard({ cardio, onToggle }) {
  return (
    <div className={`cardio-card${cardio.completed ? ' done' : ''}`}>
      <div className="cardio-icon">🏃</div>
      <div className="cardio-info">
        <div className="cardio-title">{cardio.name}</div>
        <div className="cardio-sub">
          {cardio.durationLabel} · {cardio.detailLabel}
        </div>
      </div>
      <button
        type="button"
        className={`cardio-toggle${cardio.completed ? ' done' : ''}`}
        aria-label={cardio.completed ? 'Mark cardio incomplete' : 'Mark cardio complete'}
        onClick={() => onToggle(!cardio.completed)}
      >
        {cardio.completed ? '✓' : ''}
      </button>
    </div>
  );
}
