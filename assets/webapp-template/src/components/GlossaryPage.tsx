import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

export function GlossaryPage() {
  const { course } = useApp();
  const [filter, setFilter] = useState('');
  const entries = course.glossary
    .filter((e) => {
      const q = filter.trim().toLowerCase();
      return !q || e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q);
    })
    .sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="glossary reveal">
      <h1><Icon name="BookMarked" size={22} /> Glossary</h1>
      {course.glossary.length > 0 ? (
        <>
          <div className="search" style={{ maxWidth: 360, margin: 'var(--sp-4) 0' }}>
            <Icon name="Search" size={16} className="search-icon" />
            <input type="search" placeholder="Filter terms..." value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter glossary" />
          </div>
          <dl>
            {entries.map((e) => (
              <div key={e.term} className="glossary-item" id={`glossary-${e.term}`}>
                <dt>{e.term}</dt>
                <dd>
                  {e.definition}
                  {e.seeAlso && e.seeAlso.length > 0 && <span className="muted"> See also: {e.seeAlso.join(', ')}.</span>}
                </dd>
              </div>
            ))}
          </dl>
          {entries.length === 0 && <p className="empty">No terms match "{filter}".</p>}
        </>
      ) : (
        <p className="empty">This course has no glossary yet.</p>
      )}
    </div>
  );
}
