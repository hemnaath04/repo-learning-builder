import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

export function Glossary() {
  const { course } = useApp();
  const [filter, setFilter] = useState('');
  if (!course) return null;
  const entries = course.glossary
    .filter((e) => { const q = filter.trim().toLowerCase(); return !q || e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q); })
    .sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="page reveal">
      <h1><Icon name="BookMarked" size={22} /> Glossary</h1>
      {course.glossary.length > 0 ? (
        <>
          <div className="topbar-search" style={{ maxWidth: 360, margin: 'var(--sp-4) 0' }}>
            <Icon name="Search" size={15} className="s-icon" />
            <input type="search" placeholder="Filter terms..." value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter glossary" />
          </div>
          <dl>{entries.map((e) => (
            <div key={e.term} className="glossary-item"><dt>{e.term}</dt><dd>{e.definition}{e.seeAlso?.length ? <span className="muted"> See also: {e.seeAlso.join(', ')}.</span> : null}</dd></div>
          ))}</dl>
          {entries.length === 0 && <p className="empty">No terms match "{filter}".</p>}
        </>
      ) : <p className="empty">This course has no glossary yet.</p>}
    </div>
  );
}
