import { useApp } from '../context/AppContext';
import { searchCourse } from '../lib/search';
import { Icon } from './Icon';

export function Search({ q }: { q: string }) {
  const { course, navigate } = useApp();
  if (!course) return null;
  const results = searchCourse(course, q);
  return (
    <div className="page reveal">
      <h1><Icon name="Search" size={22} /> Search</h1>
      <p className="muted">Results for <strong>"{q}"</strong></p>
      {results.length === 0 ? (
        <div className="empty"><Icon name="Search" size={24} /><p>No matches. Try a different word.</p></div>
      ) : (
        <ul className="result-list">{results.map((r) => (
          <li key={r.id}><button className="result-link" onClick={() => r.lessonId ? navigate({ view: 'lesson', lessonId: r.lessonId }) : navigate({ view: 'glossary' })}>
            <span className="result-type">{r.type}</span>
            <span className="result-title">{r.title}</span>
            <span className="result-snippet">{r.snippet}</span>
          </button></li>
        ))}</ul>
      )}
    </div>
  );
}
