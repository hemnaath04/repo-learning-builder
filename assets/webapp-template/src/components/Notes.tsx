import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';

// The Notebook hub: search, glossary, bookmarks, and per-lesson notes, so those
// features stay reachable without a top-bar search field.
export function Notes() {
  const { course, progress, navigate } = useApp();
  const [q, setQ] = useState('');
  if (!course || !progress) return null;
  const lessons = course.modules.flatMap((m) => m.lessons);
  const byId = (id: string) => lessons.find((l) => l.id === id);
  const noted = Object.entries(progress.notes).filter(([, v]) => v.trim().length > 0);

  return (
    <div className="page reveal">
      <h1><Icon name="StickyNote" size={22} /> Notebook</h1>

      <div className="notebook-tools">
        <form className="notebook-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 2) navigate({ view: 'search', q }); }}>
          <Icon name="Search" size={15} className="s-icon" />
          <input type="search" placeholder="Search lessons and glossary..." value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length >= 2) navigate({ view: 'search', q: e.target.value }); }} aria-label="Search" />
        </form>
        <button className="btn-secondary" onClick={() => navigate({ view: 'glossary' })}><Icon name="BookMarked" size={15} /> Glossary</button>
      </div>

      <section className="section">
        <h2><Icon name="Bookmark" size={18} /> Bookmarks</h2>
        {progress.bookmarks.length === 0 ? <p className="empty">No bookmarks yet. Save a lesson from its page.</p> : (
          <ul className="result-list">{progress.bookmarks.map((id) => byId(id) && (
            <li key={id}><button className="result-link" onClick={() => navigate({ view: 'lesson', lessonId: id })}><span className="result-title">{byId(id)!.title}</span></button></li>
          ))}</ul>
        )}
      </section>

      <section className="section">
        <h2><Icon name="FileCode" size={18} /> Your notes</h2>
        {noted.length === 0 ? <p className="empty">No notes yet.</p> : (
          <ul className="result-list">{noted.map(([id, text]) => byId(id) && (
            <li key={id}><button className="result-link" onClick={() => navigate({ view: 'lesson', lessonId: id })}>
              <span className="result-type">{byId(id)!.title}</span><span className="result-snippet">{text}</span>
            </button></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
