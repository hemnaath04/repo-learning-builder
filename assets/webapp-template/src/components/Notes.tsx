import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { recommendNext } from '../lib/navigation';
import { masteryLabel, isDue } from '../lib/mastery';
import { Icon } from './Icon';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

// The Notebook hub: useful even before notes/bookmarks exist. Search, glossary,
// jump-back-in, recently viewed, review queue, quiz mistakes, bookmarks, notes.
export function Notes() {
  const { course, progress, navigate, actions } = useApp();
  const [q, setQ] = useState('');
  if (!course || !progress) return null;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const byId = (id: string) => lessons.find((l) => l.id === id);
  const quizToLesson = new Map<string, string>();
  for (const l of lessons) for (const qz of l.quiz ?? []) quizToLesson.set(qz.id, l.id);

  const rec = recommendNext(course, progress);
  const resume = progress.currentLessonId && !progress.lessons[progress.currentLessonId]?.completed
    ? progress.currentLessonId : rec.lessonId;

  const recent = Object.entries(progress.lessons)
    .filter(([, v]) => v.openedAt)
    .sort((a, b) => (b[1].openedAt ?? '').localeCompare(a[1].openedAt ?? ''))
    .map(([id]) => id).slice(0, 5);

  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  const review = course.concepts.filter((c) => {
    const label = masteryLabel(progress.mastery[c.id] ?? 0, hasAttempts);
    return label === 'needs-review' || isDue(progress.review[c.id]);
  });
  const conceptLesson = (cid: string) => lessons.find((l) => l.concepts.includes(cid))?.id;

  const mistakes = [...new Set(
    Object.entries(progress.quizAttempts)
      .filter(([, at]) => at.some((a) => !a.correct))
      .map(([qid]) => quizToLesson.get(qid))
      .filter((x): x is string => Boolean(x)),
  )];

  const noted = Object.entries(progress.notes).filter(([, v]) => v.trim().length > 0);

  const linkList = (ids: string[], empty: string) => ids.length === 0
    ? <p className="muted">{empty}</p>
    : <ul className="result-list">{ids.map((id) => byId(id) && (
        <li key={id}><button className="result-link" onClick={() => navigate({ view: 'lesson', lessonId: id })}><span className="result-title">{byId(id)!.title}</span></button></li>
      ))}</ul>;

  return (
    <div className="page reveal">
      <h1><Icon name="StickyNote" size={22} /> Notebook</h1>

      <div className="notebook-tools">
        <form className="notebook-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 2) navigate({ view: 'search', q }); }}>
          <Icon name="Search" size={15} className="s-icon" />
          <input type="search" placeholder="Search lessons and glossary..." value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length >= 2) navigate({ view: 'search', q: e.target.value }); }} aria-label="Search" />
        </form>
        <button className="btn-secondary" onClick={() => navigate({ view: 'glossary' })}><Icon name="BookMarked" size={15} /> Glossary</button>
        <button className="btn-secondary" onClick={() => download(`${course.meta.id}-progress.json`, actions.exportJSON())}><Icon name="Download" size={15} /> Export</button>
      </div>

      {resume && (
        <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
          <div className="eyebrow">Jump back in</div>
          <p style={{ margin: '6px 0' }}>{rec.reason}</p>
          <button className="btn primary" onClick={() => navigate({ view: 'lesson', lessonId: resume })}><Icon name="Play" size={15} /> {byId(resume)?.title ?? 'Continue'}</button>
        </div>
      )}

      <div className="dash-grid">
        <div className="stat-card"><h2><Icon name="Clock" size={15} /> Recently viewed</h2>{linkList(recent, 'Open a lesson to see it here.')}</div>
        <div className="stat-card"><h2><Icon name="RotateCcw" size={15} /> Needs review</h2>
          {review.length === 0 ? <p className="muted">Nothing due. Nice.</p> : (
            <div className="chips-list">{review.map((c) => { const lid = conceptLesson(c.id); return (
              <button key={c.id} className="chip" onClick={() => lid && navigate({ view: 'lesson', lessonId: lid })}>{c.name}</button>
            ); })}</div>
          )}
        </div>
        <div className="stat-card"><h2><Icon name="TriangleAlert" size={15} /> Quiz mistakes</h2>{linkList(mistakes, 'No missed questions yet.')}</div>
      </div>

      <section className="section">
        <h2><Icon name="Bookmark" size={18} /> Bookmarks</h2>
        {linkList(progress.bookmarks, 'No bookmarks yet. Save a lesson from its page.')}
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
