import type { Module } from '../lib/schema';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

// Mobile: a vertical connected journey. Tapping a landmark opens its lessons in
// a bottom sheet (handled by the parent via onOpen).
export function MobileJourney({ modules, onOpen }: { modules: Module[]; onOpen: (id: string) => void }) {
  const { progress } = useApp();
  const doneOf = (m: Module) => m.lessons.every((l) => progress?.lessons[l.id]?.completed);
  return (
    <div className="mobile-journey reveal">
      {modules.map((m, i) => (
        <div key={m.id} className={`mj-node${doneOf(m) ? ' done' : ''}`}>
          <div className="mj-rail">
            <span className="mj-dot"><Icon name={doneOf(m) ? 'Check' : m.icon || 'MapPin'} size={16} /></span>
            <span className="mj-line" />
          </div>
          <div className="mj-card">
            <button className="link" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--step-1)' }} onClick={() => onOpen(m.id)}>
              {i + 1}. {m.title}
            </button>
            {m.summary && <p className="muted" style={{ margin: '4px 0 0' }}>{m.summary}</p>}
            <ul className="mj-lessons">
              {m.lessons.map((l) => <li key={l.id} className="mj-lesson">{l.title}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
