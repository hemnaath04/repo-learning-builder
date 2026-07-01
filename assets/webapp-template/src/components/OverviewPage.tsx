import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

export function OverviewPage() {
  const { course, navigate } = useApp();
  const m = course.meta;

  // Robust auto-fit grid: cards never overlap and reflow cleanly at any width.
  const facts: Array<{ label: string; value: string }> = [
    { label: 'Source type', value: m.sourceType },
    ...(m.sourceRef ? [{ label: 'Source', value: m.sourceRef }] : []),
    ...(m.goal ? [{ label: 'Goal', value: m.goal }] : []),
    ...(m.depth ? [{ label: 'Depth', value: m.depth }] : []),
    ...(m.style ? [{ label: 'Teaching style', value: m.style }] : []),
    ...(m.estimatedMinutes ? [{ label: 'Estimated time', value: `~${m.estimatedMinutes} minutes` }] : []),
    { label: 'Generated', value: new Date(m.generatedAt).toLocaleDateString() },
  ];

  return (
    <div className="overview reveal">
      <h1>About this course</h1>
      <p className="overview-lead">{m.promise ?? m.subtitle ?? `A guided course generated from ${m.sourceRef ?? m.sourceType}.`}</p>

      <dl className="overview-facts">
        {facts.map((f) => (
          <div key={f.label} className="fact">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      {m.outcomes && m.outcomes.length > 0 && (
        <>
          <div className="section-title"><Icon name="Target" size={18} /><h2>You will be able to</h2></div>
          <div className="outcomes">
            {m.outcomes.map((o, i) => (
              <div key={i} className="outcome"><span className="oc-num">{i + 1}</span><span>{o}</span></div>
            ))}
          </div>
        </>
      )}

      <div className="section-title"><Icon name="Map" size={18} /><h2>What you will learn</h2></div>
      <ol className="path">
        {course.modules.map((mod, i) => (
          <li key={mod.id} className="path-card" style={{ listStyle: 'none' }}>
            <div className="path-head">
              <h3>{i + 1}. {mod.title}</h3>
              <span className="chip">{mod.lessons.length} lessons</span>
            </div>
            {mod.summary && <p className="muted">{mod.summary}</p>}
          </li>
        ))}
      </ol>

      <button className="btn primary" onClick={() => navigate({ name: 'home' })}>
        <Icon name="ArrowRight" size={16} /> Back to the path
      </button>
    </div>
  );
}
