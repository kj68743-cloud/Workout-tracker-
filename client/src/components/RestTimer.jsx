import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available — silently skip */
  }
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

const RestTimer = forwardRef(function RestTimer({ onActiveChange }, ref) {
  const [state, setState] = useState(null); // { label, total, remaining }
  const intervalRef = useRef(null);

  // The timer bar is fixed near the bottom of the screen and can sit on
  // top of the cardio toggle / last exercise's set circles while it's
  // showing. Let the parent know so it can reserve space instead of
  // letting the bar block taps underneath it.
  useEffect(() => {
    onActiveChange?.(!!state);
  }, [state, onActiveChange]);

  useImperativeHandle(ref, () => ({
    start(seconds, label) {
      clearInterval(intervalRef.current);
      setState({ label, total: seconds, remaining: seconds });
    },
    dismiss() {
      clearInterval(intervalRef.current);
      setState(null);
    },
  }));

  useEffect(() => {
    if (!state) return;
    intervalRef.current = setInterval(() => {
      setState((s) => {
        if (!s) return s;
        if (s.remaining <= 1) {
          clearInterval(intervalRef.current);
          playBeep();
          vibrate([200, 100, 200]);
          return null;
        }
        return { ...s, remaining: s.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.total, state?.label]);

  if (!state) return null;

  const pct = state.remaining / state.total;
  const r = 18;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="rest-timer" role="status" aria-live="polite">
      <svg className="rest-ring" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#2c2a31" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="#ffb020"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="rest-info">
        <div className="rest-title">Rest — {state.label}</div>
        <div className="rest-time">{state.remaining}s</div>
      </div>
      <div className="rest-actions">
        <button
          type="button"
          onClick={() => setState((s) => (s ? { ...s, total: s.total + 15, remaining: s.remaining + 15 } : s))}
        >
          +15s
        </button>
        <button type="button" onClick={() => { clearInterval(intervalRef.current); setState(null); }}>
          Skip
        </button>
      </div>
    </div>
  );
});

export default RestTimer;
