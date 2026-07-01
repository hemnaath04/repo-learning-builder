import { useApp, type View } from '../context/AppContext';
import { completionPercent } from '../lib/navigation';
import { Icon } from './Icon';

// Views reachable from the top bar / bottom nav. Active state is derived from the
// route so it never drifts from what is shown.
const NAV: Array<{ view: View; label: string; icon: string; match: View[] }> = [
  { view: 'atlas', label: 'Learning map', icon: 'Map', match: ['atlas', 'lesson', 'certificate'] },
  { view: 'explorer', label: 'Repository', icon: 'FolderTree', match: ['explorer'] },
  { view: 'notes', label: 'Notebook', icon: 'StickyNote', match: ['notes', 'glossary', 'search'] },
];

export function AtlasTopBar() {
  const { course, progress, route, navigate, registry, courseId, selectCourse } = useApp();
  const pct = course && progress ? completionPercent(course, progress) : 0;
  const isRepo = course?.meta.sourceType === 'repository' || course?.meta.sourceType === 'github-url';
  const manyCourses = (registry?.courses.length ?? 0) > 1;
  const items = NAV.filter((n) => n.view !== 'explorer' || isRepo);
  const isActive = (m: View[]) => m.includes(route.view);

  return (
    <>
      <header className="topbar">
        <div className="tb-left">
          <button className="brand" onClick={() => navigate({ view: 'atlas' })} aria-label="repo.school home">
            <span className="brand-mark">RS</span>
            <span className="brand-name">repo.school</span>
            <span className="brand-beta">BETA</span>
          </button>
          {manyCourses && (
            <select className="tb-course" value={courseId ?? ''} onChange={(e) => selectCourse(e.target.value)} aria-label="Course">
              {registry!.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
        </div>

        <nav className="tb-center" aria-label="Sections">
          {items.map((n) => (
            <button key={n.view} className={`tb-nav${isActive(n.match) ? ' active' : ''}`} aria-current={isActive(n.match) ? 'page' : undefined} onClick={() => navigate({ view: n.view })}>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="tb-right">
          <button className="tb-progress" onClick={() => navigate({ view: 'dashboard' })}>{pct}% complete</button>
          <button className="tb-avatar" onClick={() => navigate({ view: 'settings' })} aria-label="Settings">
            <Icon name="Settings" size={17} />
          </button>
        </div>
      </header>

      {/* Mobile bottom navigation (shown < 768px). 44px+ touch targets. */}
      <nav className="bottomnav" aria-label="Sections">
        {items.map((n) => (
          <button key={n.view} className={`bn-item${isActive(n.match) ? ' active' : ''}`} aria-current={isActive(n.match) ? 'page' : undefined} onClick={() => navigate({ view: n.view })}>
            <Icon name={n.icon} size={20} /> <span>{n.label === 'Learning map' ? 'Map' : n.label}</span>
          </button>
        ))}
        <button className={`bn-item${route.view === 'dashboard' ? ' active' : ''}`} onClick={() => navigate({ view: 'dashboard' })}>
          <Icon name="BarChart3" size={20} /> <span>Progress</span>
        </button>
        <button className={`bn-item${route.view === 'settings' ? ' active' : ''}`} onClick={() => navigate({ view: 'settings' })}>
          <Icon name="Settings" size={20} /> <span>Settings</span>
        </button>
      </nav>
    </>
  );
}
