import { useEffect, useMemo, useState } from 'react';
import type { Worked } from '../lib/schema';
import { Markdown } from './Markdown';
import { Icon } from './Icon';

const PLAY_MS = 2200;

// One real input traced through the system, one step at a time, with the live
// state shown at each step. Play advances automatically; values that changed
// since the previous step are highlighted so the eye follows the data.
export function WorkedExample({ data }: { data: Worked }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const step = data.steps[i];
  const last = i === data.steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (i >= data.steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((n) => Math.min(n + 1, data.steps.length - 1)), PLAY_MS);
    return () => clearTimeout(t);
  }, [playing, i, data.steps.length]);

  const goTo = (n: number) => { setPlaying(false); setI(n); };

  // Keys that are new or whose value changed since the previous step.
  const changed = useMemo(() => {
    const prev = new Map((i > 0 ? data.steps[i - 1].state ?? [] : []).map((p) => [p.k, p.v]));
    return new Set((step.state ?? []).filter((p) => !prev.has(p.k) || prev.get(p.k) !== p.v).map((p) => p.k));
  }, [data.steps, i, step.state]);

  return (
    <div className="worked">
      <p className="worked-intro"><Markdown text={data.intro} /></p>

      <div className="worked-rail" role="tablist" aria-label="Example steps">
        <button
          className="worked-play"
          onClick={() => (last && !playing ? (setI(0), setPlaying(true)) : setPlaying((p) => !p))}
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause' : 'Play all steps'}
        >
          <Icon name={playing ? 'Pause' : 'Play'} size={14} />
        </button>
        {data.steps.map((s, n) => (
          <button
            key={n}
            role="tab"
            aria-selected={n === i}
            className={`worked-dot${n === i ? ' active' : ''}${n < i ? ' done' : ''}`}
            onClick={() => goTo(n)}
            title={s.label}
          >
            {n + 1}
          </button>
        ))}
      </div>

      <div className="worked-step" key={i} aria-live="polite">
        <div className="worked-label">
          <span className="worked-num">Step {i + 1} of {data.steps.length}</span>
          <h3>{step.label}</h3>
        </div>
        {step.detail && <Markdown text={step.detail} />}
        {step.state && step.state.length > 0 && (
          <dl className="worked-state">
            {step.state.map((p, n) => (
              <div key={p.k} className={`ws-row${changed.has(p.k) ? ' changed' : ''}`} style={{ animationDelay: `${n * 60}ms` }}>
                <dt>{p.k}</dt>
                <dd><code>{p.v}</code></dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="worked-nav">
        <button className="btn ghost" disabled={i === 0} onClick={() => goTo(i - 1)}>
          <Icon name="ChevronLeft" size={15} /> Back
        </button>
        {!last ? (
          <button className="btn primary" onClick={() => goTo(i + 1)}>
            Next step <Icon name="ChevronRight" size={15} />
          </button>
        ) : (
          <button className="btn ghost" onClick={() => goTo(0)}>
            <Icon name="RotateCcw" size={15} /> Replay
          </button>
        )}
      </div>

      {last && data.outcome && (
        <div className="worked-outcome">
          <Icon name="Check" size={15} /> <Markdown text={data.outcome} />
        </div>
      )}
    </div>
  );
}
