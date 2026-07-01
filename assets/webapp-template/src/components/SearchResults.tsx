import { useApp } from '../context/AppContext';
import { searchCourse } from '../lib/search';
import { Icon } from './Icon';

export function SearchResults({ q }: { q: string }) {
  const { course, level, navigate } = useApp();
  const results = searchCourse(course, q, level);

  return (
    <div className="search-results reveal">
      <h1><Icon name="Search" size={22} /> Search</h1>
      <p className="muted">Results for <strong>"{q}"</strong></p>
      {results.length === 0 ? (
        <div className="empty"><Icon name="Search" size={26} className="empty-icon" /><p>No matches. Try a different word.</p></div>
      ) : (
        <ul className="result-list">
          {results.map((r) => (
            <li key={r.id}>
              <button className="result-link" onClick={() => (r.lessonId ? navigate({ name: 'lesson', lessonId: r.lessonId }) : navigate({ name: 'glossary' }))}>
                <span className="result-type">{r.type}</span>
                <span style={{ fontWeight: 600 }}>{r.title}</span>
                <span className="result-snippet">{r.snippet}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
