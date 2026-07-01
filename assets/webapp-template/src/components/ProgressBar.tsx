export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progressbar-wrap">
      <div
        className="progressbar"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${clamped} percent`}
      >
        <span className="progressbar-fill" style={{ width: `${clamped}%` }} />
      </div>
      {label && <span className="progressbar-label">{label}</span>}
    </div>
  );
}
