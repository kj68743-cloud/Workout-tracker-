const STEPS = [
  {
    icon: '⭕',
    title: 'Tap a circle to log a set',
    body: 'Each exercise has a circle per set. Tap it when you finish the set — it fills in and a rest timer starts automatically.',
  },
  {
    icon: '✏️',
    title: 'Tap a weight to edit it',
    body: 'Tap the weight number on any exercise to update it. It saves instantly and shows up next time that exercise comes around — even on a different day.',
  },
  {
    icon: '🏃',
    title: 'Cardio counts too',
    body: 'The incline treadmill walk is part of every day. Mark it done to complete your daily progress and keep your streak alive.',
  },
  {
    icon: '📈',
    title: 'Track your progress',
    body: 'Check History for a calendar of past workouts, and Body to log weekly weight & waist measurements.',
  },
];

export default function Onboarding({ onDone }) {
  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="onboarding-icon">💪</div>
        <h1>Welcome, Komal</h1>
        <p className="lead">
          Here's a quick rundown of your Five-Day Split Tracker before you get started.
        </p>

        {STEPS.map((step) => (
          <div className="onboarding-step" key={step.title}>
            <div className="step-icon">{step.icon}</div>
            <div className="step-text">
              <b>{step.title}</b>
              <span>{step.body}</span>
            </div>
          </div>
        ))}

        <div className="onboarding-footer">
          <button className="btn-primary" onClick={onDone}>
            Let's go
          </button>
        </div>
      </div>
    </div>
  );
}
