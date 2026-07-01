import { useApp, type Route } from '../context/AppContext';
import { moduleCompleted, isModuleAhead, isLessonAccessible } from '../lib/navigation';
import { Icon } from './Icon';

const NAV: Array<{ label: string; icon: string; route: Route }> = [
  { label: 'Home', icon: 'Home', route: { name: 'home' } },
  { label: 'Overview', icon: 'BookOpen', route: { name: 'overview' } },
  { label: 'Progress', icon: 'BarChart3', route: { name: 'dashboard' } },
  { label: 'Explore repo', icon: 'FolderTree', route: { name: 'explorer' } },
  { label: 'Glossary', icon: 'BookMarked', route: { name: 'glossary' } },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { course, progress, route, navigate } = useApp();
  const go = (r: Route) => {
    navigate(r);
    onNavigate?.();
  };
  const activeLesson = route.name === 'lesson' ? route.lessonId : null;
  const isRepo = course.meta.sourceType === 'repository' || course.meta.sourceType === 'github-url';

  return (
    <nav className="sidebar" aria-label="Course navigation">
      <ul className="nav-primary">
        {NAV.filter((n) => n.route.name !== 'explorer' || isRepo).map((item) => (
          <li key={item.label}>
            <button className={`nav-link${route.name === item.route.name ? ' active' : ''}`} onClick={() => go(item.route)}>
              <Icon name={item.icon} size={16} /> {item.label}
            </button>
          </li>
        ))}
      </ul>

      <ol className="journey-rail">
        {course.modules.map((mod) => {
          const done = moduleCompleted(course, mod.id, progress);
          const ahead = isModuleAhead(course, mod.id, progress);
          const current = !done && !ahead;
          return (
            <li key={mod.id} className={`journey-mod ${done ? 'done' : current ? 'current' : ''}`}>
              <span className="journey-dot">{done ? <Icon name="Check" size={10} /> : null}</span>
              <p className="journey-modtitle">
                {mod.title}
                {ahead && <Icon name="Eye" size={12} className="muted" />}
              </p>
              <ul className="journey-lessons">
                {mod.lessons.map((lesson) => {
                  const lp = progress.lessons[lesson.id];
                  const accessible = isLessonAccessible(course, lesson.id, progress);
                  return (
                    <li key={lesson.id}>
                      <button
                        className={`lesson-link${activeLesson === lesson.id ? ' active' : ''}${lp?.completed ? ' completed' : ''}${ahead ? ' preview' : ''}`}
                        disabled={!accessible}
                        onClick={() => go({ name: 'lesson', lessonId: lesson.id })}
                      >
                        <span className="status">
                          <Icon name={lp?.completed ? 'Check' : lp?.opened ? 'CircleDot' : 'Circle'} size={13} />
                        </span>
                        {lesson.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
