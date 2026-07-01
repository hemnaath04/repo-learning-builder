import { useApp } from '../context/AppContext';
import { AtlasTopBar } from './AtlasTopBar';
import { LearningAtlas } from './LearningAtlas';
import { LessonReader } from './LessonReader';
import { RepositoryExplorer } from './RepositoryExplorer';
import { ProgressDashboard } from './ProgressDashboard';
import { Glossary } from './Glossary';
import { Search } from './Search';
import { Notes } from './Notes';
import { Settings } from './Settings';
import { Certificate } from './Certificate';
import { Icon } from './Icon';

function Loading() {
  return <div className="centered"><div><div className="spinner" /><p className="muted">Loading your atlas...</p></div></div>;
}
function ErrorState({ msg }: { msg?: string }) {
  return (
    <div className="centered">
      <div className="empty" style={{ maxWidth: 460 }}>
        <Icon name="TriangleAlert" size={26} />
        <h2>Could not load a course</h2>
        <p>{msg ?? 'The course registry is missing.'}</p>
        <p className="muted">Add a course under <code>public/courses/</code> and list it in <code>public/courses/index.json</code>.</p>
      </div>
    </div>
  );
}
function EmptyState() {
  return (
    <div className="centered">
      <div className="empty" style={{ maxWidth: 460 }}>
        <Icon name="Compass" size={26} />
        <h2>No courses yet</h2>
        <p>Generate one with the repo-learning-builder skill, then it appears here.</p>
      </div>
    </div>
  );
}

function CourseView() {
  const { route } = useApp();
  switch (route.view) {
    case 'lesson': return <LessonReader lessonId={route.lessonId ?? ''} />;
    case 'explorer': return <RepositoryExplorer />;
    case 'dashboard': return <ProgressDashboard />;
    case 'glossary': return <Glossary />;
    case 'search': return <Search q={route.q ?? ''} />;
    case 'notes': return <Notes />;
    case 'settings': return <Settings />;
    case 'certificate': return <Certificate />;
    case 'atlas':
    default: return <LearningAtlas />;
  }
}

export function App() {
  const { status, error } = useApp();
  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <AtlasTopBar />
      <main id="main" tabIndex={-1}>
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorState msg={error} />}
        {status === 'empty' && <EmptyState />}
        {status === 'ready' && <CourseView />}
      </main>
    </div>
  );
}
