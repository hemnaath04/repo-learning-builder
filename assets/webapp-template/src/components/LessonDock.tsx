import type { Module } from '../lib/schema';
import type { Landmark } from '../lib/landmarks';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

const STATUS_LABEL: Record<string, string> = { ready: 'Ready', current: 'In progress', completed: 'Completed', locked: 'Locked' };

// Contextual lesson dock (dark panel on desktop, bottom panel on tablet, bottom
// sheet on mobile). Shows the selected landmark and its lessons.
export function LessonDock({ landmark, module, onNavigate }: { landmark: Landmark | null; module: Module | null; onNavigate?: () => void }) {
  const { progress, navigate } = useApp();
  if (!landmark || !module) {
    return <div className="dock"><p className="dock-empty">Pick a landmark to see its lessons.</p></div>;
  }
  const open = (lessonId: string) => { navigate({ view: 'lesson', lessonId }); onNavigate?.(); };
  const num = String(landmark.order).padStart(2, '0');
  return (
    <div className="dock">
      <div className="dock-status">
        <span className="dock-status-label">Selected landmark</span>
        <span className={`dock-ready st-${landmark.status}`}>{STATUS_LABEL[landmark.status] ?? 'Ready'}</span>
      </div>

      <div className="dock-lead">
        <span className="dock-num">{num}</span>
        <h2 className="dock-title">{landmark.title}</h2>
        {landmark.description && <p className="dock-desc">{landmark.description}</p>}
      </div>

      <div className="dock-contents">
        <span className="dock-contents-label">Inside this landmark</span>
        <ul className="dock-lessons">
          {module.lessons.map((l, i) => (
            <li key={l.id}>
              <button className="dock-lesson" onClick={() => open(l.id)}>
                <span className="dl-num">{progress?.lessons[l.id]?.completed ? <Icon name="Check" size={13} /> : String(i + 1).padStart(2, '0')}</span>
                <span className="dl-title">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button className="dock-begin" onClick={() => module.lessons[0] && open(module.lessons[0].id)}>
        Begin landmark <Icon name="ArrowRight" size={18} />
      </button>

      <p className="dock-foot">Your progress is saved automatically. Future landmarks stay visible so you always know where you are going.</p>
    </div>
  );
}
