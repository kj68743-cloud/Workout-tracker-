// Minimal dependency-free SVG line chart for a single series of {x, y}.
export default function LineChart({ points, color = '#ffb020', unit = '', height = 140 }) {
  if (!points || points.length === 0) {
    return <div className="metrics-empty">No data yet — log an entry to see your trend.</div>;
  }

  const width = 100; // viewBox units — scales responsively via CSS width 100%
  const padY = 10;
  const values = points.map((p) => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
    const y = padY + (1 - (p.y - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const areaPath = `${path} L${width},${height} L0,${height} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.y - first.y;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)', marginTop: 4 }}>
        <span>
          {first.y}
          {unit}
        </span>
        <span style={{ color: delta === 0 ? 'var(--text-dim)' : delta < 0 ? 'var(--complete-text)' : 'var(--accent)', fontWeight: 700 }}>
          {delta > 0 ? '+' : ''}
          {delta.toFixed(1)}
          {unit} overall
        </span>
        <span>
          {last.y}
          {unit}
        </span>
      </div>
    </div>
  );
}
