// A small dependency-free SVG radar of concept mastery. Falls back to a labelled
// bar list when there are too few axes to make a meaningful polygon.
export interface RadarPoint { label: string; value: number } // value 0..1

export function Radar({ points, size = 260 }: { points: RadarPoint[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = points.length;

  if (n < 3) {
    return (
      <div className="chips-list" style={{ flexDirection: 'column', gap: 8 }}>
        {points.map((p) => (
          <div key={p.label} className="stat-row">
            <span>{p.label}</span>
            <span>{Math.round(p.value * 100)}%</span>
          </div>
        ))}
      </div>
    );
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pointAt = (i: number, radius: number) => [cx + radius * Math.cos(angleFor(i)), cy + radius * Math.sin(angleFor(i))];

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    points.map((_, i) => pointAt(i, r * f).join(',')).join(' '),
  );
  const shape = points.map((p, i) => pointAt(i, r * Math.max(0.04, p.value)).join(',')).join(' ');

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Concept mastery radar">
      {rings.map((pts, i) => (
        <polygon key={i} className="radar-grid" points={pts} />
      ))}
      {points.map((_, i) => {
        const [x, y] = pointAt(i, r);
        return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className="radar-shape" points={shape} />
      {points.map((p, i) => {
        const [x, y] = pointAt(i, r + 16);
        return (
          <text key={p.label} className="radar-label" x={x} y={y} textAnchor="middle" dominantBaseline="middle">
            {p.label.length > 14 ? p.label.slice(0, 13) + '…' : p.label}
          </text>
        );
      })}
    </svg>
  );
}
