import { useApp, type View } from '../context/AppContext';
import { completionPercent } from '../lib/navigation';
import { Icon } from './Icon';

// Views reachable from the atlas top bar. Progress opens from "% explored",
// Settings/Glossary/Search remain reachable (Settings via avatar, Glossary +
// Search from the Notebook page), so no feature is lost.
const NAV: Array<{ view: View; label: string; match: View[] }> = [
  { view: 'atlas', label: 'Learning map', match: ['atlas', 'lesson', 'certificate'] },
  { view: 'explorer', label: 'Repository', match: ['explorer'] },
  { view: 'notes', label: 'Notebook', match: ['notes', 'glossary', 'search'] },
];

export function AtlasTopBar() {
  const { course, progress, route, navigate, registry, courseId, selectCourse } = useApp();
  const pct = course && progress ? completionPercent(course, progress) : 0;
  const isRepo = course?.meta.sourceType === 'repository' || course?.meta.sourceType === 'github-url';
  const manyCourses = (registry?.courses.length ?? 0) > 1;

  return (
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
        {NAV.filter((n) => n.view !== 'explorer' || isRepo).map((n) => {
          const active = n.match.includes(route.view);
          return (
            <button key={n.view} className={`tb-nav${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => navigate({ view: n.view })}>
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="tb-right">
        <button className="tb-progress" onClick={() => navigate({ view: 'dashboard' })}>{pct}% explored</button>
        <button className="tb-avatar" onClick={() => navigate({ view: 'settings' })} aria-label="Settings">
          <Icon name="User" size={17} />
        </button>
      </div>
    </header>
  );
}
