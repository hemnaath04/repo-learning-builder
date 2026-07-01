import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
import { PredictReveal } from './PredictReveal';
import { WorkedExample } from './WorkedExample';
import { ScenarioPlayer } from './ScenarioPlayer';
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
  const { course, progress, actions, navigate, courseId } = useApp();
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

  // Sections unfold as you read. Elements above the fold reveal immediately;
  // without IntersectionObserver (tests, old browsers) everything stays visible.
  useLayoutEffect(() => {
    const els = document.querySelectorAll('.reader-main .section, .reader-main .callout, .reader-main .predict');
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach((el) => { el.classList.add('will-reveal'); io.observe(el); });
    return () => io.disconnect();
  }, [lessonId]);

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

  // Course assets (figures) live next to course.json: courses/<id>/<file>.
  const figureSrc = lesson.figure
    ? (/^(https?:)?\//.test(lesson.figure.src) ? lesson.figure.src : `courses/${courseId}/${lesson.figure.src}`)
    : null;

  const sections: Array<{ id: string; label: string }> = [];
  if (lesson.summary) sections.push({ id: 'overview', label: 'Overview' });
  if (lesson.facets?.length) sections.push({ id: 'idea', label: 'The idea' });
  if (lesson.diagram) sections.push({ id: 'diagram', label: 'Diagram' });
  if (lesson.flow?.length) sections.push({ id: 'flow', label: 'Flow' });
  if (lesson.worked) sections.push({ id: 'run', label: 'Example run' });
  if (lesson.walkthrough?.length) sections.push({ id: 'code', label: 'Code' });
  if (lesson.scenario) sections.push({ id: 'whatif', label: 'What if' });
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
              {/* key by lesson so a newly opened lesson resets to "What is it?" */}
              <FacetSwitcher key={lessonId} facets={lesson.facets} />
            </section>
          )}

          {lesson.predict && <PredictReveal key={`p-${lessonId}`} data={lesson.predict} />}

          {lesson.figure && figureSrc && (
            <figure className="lesson-figure">
              <img src={figureSrc} alt={lesson.figure.alt} loading="lazy" />
              {lesson.figure.caption && <figcaption>{lesson.figure.caption}</figcaption>}
            </figure>
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

          {lesson.worked && (
            <section id="run" className="section">
              <h2><Icon name="Play" size={18} /> {lesson.worked.title ?? 'Watch it run'}</h2>
              <WorkedExample key={`w-${lessonId}`} data={lesson.worked} />
            </section>
          )}

          {lesson.walkthrough && lesson.walkthrough.length > 0 && (
            <section id="code" className="section">
              <h2><Icon name="Code2" size={18} /> Code walkthrough</h2>
              <CodeWalkthrough steps={lesson.walkthrough} />
            </section>
          )}

          {lesson.scenario && (
            <section id="whatif" className="section">
              <h2><Icon name="FlaskConical" size={18} /> {lesson.scenario.title ?? 'What happens if...'}</h2>
              <ScenarioPlayer key={`s-${lessonId}`} data={lesson.scenario} />
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
            {/* Only an undo affordance once complete; the primary is the single
                control that marks complete, so there are never two that do the same thing. */}
            {completed && (
              <button className="btn ghost" onClick={() => actions.completeLesson(lessonId, false)}>
                <Icon name="RotateCcw" size={16} /> Mark as not done
              </button>
            )}
            {next ? (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ view: 'lesson', lessonId: next.id }); }}>
                {completed ? 'Continue' : 'Complete and continue'} <Icon name="ChevronRight" size={16} />
              </button>
            ) : (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ view: 'certificate' }); }}>
                {completed ? 'Finish' : 'Complete and finish'} <Icon name="Trophy" size={16} />
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
