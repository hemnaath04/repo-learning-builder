import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { HomePage } from './HomePage';
import { OverviewPage } from './OverviewPage';
import { LessonView } from './LessonView';
import { GlossaryPage } from './GlossaryPage';
import { ExplorerPage } from './ExplorerPage';
import { DashboardPage } from './DashboardPage';
import { SearchResults } from './SearchResults';
import { Certificate } from './Certificate';
import { Icon } from './Icon';

function Content() {
  const { route } = useApp();
  switch (route.name) {
    case 'home': return <HomePage />;
    case 'overview': return <OverviewPage />;
    case 'lesson': return <LessonView lessonId={route.lessonId} />;
    case 'glossary': return <GlossaryPage />;
    case 'explorer': return <ExplorerPage />;
    case 'dashboard': return <DashboardPage />;
    case 'search': return <SearchResults q={route.q} />;
    case 'certificate': return <Certificate />;
    default: return <HomePage />;
  }
}

export function App() {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Topbar />
      <button className="nav-toggle" aria-expanded={navOpen} aria-controls="sidebar" onClick={() => setNavOpen((v) => !v)}>
        <Icon name={navOpen ? 'X' : 'Menu'} size={16} /> {navOpen ? 'Close' : 'Menu'}
      </button>
      <div className="app-body">
        <div id="sidebar" className={`sidebar-wrap${navOpen ? ' open' : ''}`}>
          <Sidebar onNavigate={() => setNavOpen(false)} />
        </div>
        {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />}
        <main id="main" className="content" tabIndex={-1}>
          <Content />
        </main>
      </div>
    </div>
  );
}
