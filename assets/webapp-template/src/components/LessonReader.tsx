import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Markdown } from './Markdown';
import { Disclosure } from './Disclosure';
import { Mermaid } from './Mermaid';
import { QuizBlock } from './QuizBlock';
import { CodeWalkthrough } from './CodeWalkthrough';
import { FacetSwitcher } from './FacetSwitcher';
import { Callout } from './Callout';
import { FlowSteps } from './FlowSteps';
import { CompareTable } from './CompareTable';
import { TechCards } from './TechCards';
import { Icon } from './Icon';
import { nextLesson, prevLesson, completionPercent } from '../lib/navigation';

function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return p;
}

export function LessonReader({ lessonId }: { lessonId: string }) {
  const { course, progress, actions, navigate } = useApp();
  const lesson = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  const moduleOf = course?.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  const reading = progress?.preferences.reducedChrome ?? false;
  const scroll = useScrollProgress();

  const [note, setNote] = useState('');
  const [teach, setTeach] = useState('');
  useEffect(() => {
    setNote(progress?.notes[lessonId] ?? '');
    setTeach(progress?.teachBack[lessonId] ?? '');
  }, [lessonId, progress?.notes, progress?.teachBack]);

  const next = useMemo(() => (course ? nextLesson(course, lessonId) : null), [course, lessonId]);
  const prev = useMemo(() => (course ? prevLesson(course, lessonId) : null), [course, lessonId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' && next) navigate({ view: 'lesson', lessonId: next.id });
      if (e.key === 'ArrowLeft' && prev) navigate({ view: 'lesson', lessonId: prev.id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, navigate]);

  if (!course || !progress || !lesson || !moduleOf) return <p className="empty">Lesson not found.</p>;

  const completed = progress.lessons[lessonId]?.completed ?? false;
  const coursePct = completionPercent(course, progress);
  const recap = lesson.concepts
    .map((id) => course.concepts.find((c) => c.id === id))
    .map((c) => (c ? c.summary ?? c.name : null))
    .filter((s): s is string => Boolean(s));

  const sections: Array<{ id: string; label: string }> = [];
  if (lesson.summary) sections.push({ id: 'overview', label: 'Overview' });
  if (lesson.facets?.length) sections.push({ id: 'idea', label: 'The idea' });
  if (lesson.diagram) sections.push({ id: 'diagram', label: 'Diagram' });
  if (lesson.flow?.length) sections.push({ id: 'flow', label: 'Flow' });
  if (lesson.walkthrough?.length) sections.push({ id: 'code', label: 'Code' });
  if (lesson.tech?.length) sections.push({ id: 'tech', label: 'Tech' });
  if (lesson.quiz?.length) sections.push({ id: 'check', label: 'Check' });
  if (recap.length) sections.push({ id: 'recap', label: 'Recap' });

  return (
    <div className={`reader-page${reading ? ' reading-mode' : ''}`}>
      <div className="reader-top">
        <div className="bar"><span style={{ width: `${scroll}%` }} /></div>
        <div className="meta">
          <span>{coursePct}% of course complete</span>
          <button className="btn ghost" onClick={() => actions.setPreference('reducedChrome', !reading)}>
            <Icon name={reading ? 'Eye' : 'EyeOff'} size={14} /> {reading ? 'Show columns' : 'Reading mode'}
          </button>
        </div>
      </div>

      <div className="reader">
        <article className="reader-main reveal">
          <button className="reader-crumb" onClick={() => navigate({ view: 'atlas' })}>
            <Icon name="Map" size={12} /> {moduleOf.title}
          </button>
          <div className="reader-hero">
            <span className="rh-icon"><Icon name={lesson.icon} size={22} /></span>
            <div>
              <h1>{lesson.title}</h1>
              <div className="identity-meta">
                <span className={`badge a-ultramarine`}>{lesson.typeLabel}</span>
                {lesson.est && <span className="chip"><Icon name="Clock" size={12} /> {lesson.est} min</span>}
                <button className="btn ghost" onClick={() => actions.toggleBookmark(lessonId)} aria-pressed={progress.bookmarks.includes(lessonId)}>
                  <Icon name="Bookmark" size={14} /> {progress.bookmarks.includes(lessonId) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {lesson.summary && (
            <section id="overview" className="section"><p className="reader-lead">{lesson.summary}</p></section>
          )}

          {lesson.facets && lesson.facets.length > 0 && (
            <section id="idea" className="section">
              <h2><Icon name="Lightbulb" size={18} /> The idea</h2>
              <FacetSwitcher facets={lesson.facets} />
            </section>
          )}

          {lesson.diagram && (
            <section id="diagram" className="section">
              <h2><Icon name="Network" size={18} /> {lesson.diagram.title}</h2>
              <Mermaid code={lesson.diagram.code} title={lesson.diagram.title} />
            </section>
          )}

          {lesson.flow && lesson.flow.length > 0 && (
            <section id="flow" className="section">
              <h2><Icon name="Route" size={18} /> Step by step</h2>
              <FlowSteps steps={lesson.flow} />
            </section>
          )}

          {lesson.walkthrough && lesson.walkthrough.length > 0 && (
            <section id="code" className="section">
              <h2><Icon name="Code2" size={18} /> Code walkthrough</h2>
              <CodeWalkthrough steps={lesson.walkthrough} />
            </section>
          )}

          {lesson.tech && lesson.tech.length > 0 && (
            <section id="tech" className="section">
              <h2><Icon name="Cpu" size={18} /> Technologies</h2>
              <TechCards tech={lesson.tech} />
            </section>
          )}

          {lesson.compare && (
            <section className="section">
              <h2><Icon name="Scale" size={18} /> Comparison</h2>
              <CompareTable data={lesson.compare} />
            </section>
          )}

          {lesson.callouts?.map((c, i) => <Callout key={i} data={c} />)}

          {lesson.sources && lesson.sources.length > 0 && (
            <section className="section">
              <h2><Icon name="FileCode" size={18} /> Where this lives</h2>
              <div className="sources">
                {lesson.sources.map((s, i) => (
                  <div key={i} className="source">
                    <Icon name="FileCode" size={13} />
                    <code>{s.path}{s.lines ? `:${s.lines}` : ''}</code>
                    {s.note && <span className="source-note">{s.note}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.quiz?.map((q) => (
            <section id="check" className="section" key={q.id}><QuizBlock quiz={q} /></section>
          ))}

          {lesson.activity && (
            <section className="section">
              <div className="activity">
                <h3><Icon name="Dumbbell" size={16} /> Try it yourself</h3>
                <Markdown text={lesson.activity} />
                <label className="activity-done">
                  <input type="checkbox" checked={progress.exercises[lessonId]?.done ?? false}
                    onChange={(e) => actions.setExerciseDone(lessonId, e.target.checked, lesson.concepts)} />
                  I did this
                </label>
              </div>
            </section>
          )}

          {lesson.teachBack && (
            <section className="section">
              <div className="teach-back">
                <h3><Icon name="Mic" size={16} /> Explain it in your own words</h3>
                <Markdown text={lesson.teachBack} />
                <textarea value={teach} rows={4} placeholder="Type your explanation..."
                  onChange={(e) => setTeach(e.target.value)} onBlur={() => actions.setTeachBack(lessonId, teach)} />
              </div>
            </section>
          )}

          {lesson.deeper && (
            <Disclosure summary="Go deeper (optional)"><Markdown text={lesson.deeper} /></Disclosure>
          )}

          {recap.length > 0 && (
            <section id="recap" className="section">
              <div className="recap">
                <h2><Icon name="ListChecks" size={18} /> Recap</h2>
                <ul>{recap.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </section>
          )}

          <section className="section">
            <h3><Icon name="Bookmark" size={16} /> Your notes</h3>
            <textarea value={note} rows={3} placeholder="Private notes for this lesson..."
              onChange={(e) => setNote(e.target.value)} onBlur={() => actions.setNote(lessonId, note)} />
          </section>

          <footer className="reader-foot">
            <button className="btn ghost" disabled={!prev} onClick={() => prev && navigate({ view: 'lesson', lessonId: prev.id })}>
              <Icon name="ChevronLeft" size={16} /> Previous
            </button>
            <button className={`btn ${completed ? 'ghost' : ''}`} onClick={() => actions.completeLesson(lessonId, !completed)}>
              <Icon name={completed ? 'RotateCcw' : 'Check'} size={16} /> {completed ? 'Mark as not done' : 'Mark complete'}
            </button>
            {next ? (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ view: 'lesson', lessonId: next.id }); }}>
                Continue <Icon name="ChevronRight" size={16} />
              </button>
            ) : (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ view: 'certificate' }); }}>
                Finish <Icon name="Trophy" size={16} />
              </button>
            )}
          </footer>
          <p className="kbd-hint">Use <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> to move between lessons.</p>
        </article>

        <aside className="reader-toc" aria-label="On this page">
          {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
        </aside>
      </div>
    </div>
  );
}
