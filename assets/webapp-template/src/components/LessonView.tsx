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
import { nextLesson, prevLesson, isLessonAccessible, completionPercent } from '../lib/navigation';
import type { ExplanationLevel, Lesson } from '../lib/schema';

interface Section { id: string; label: string; icon: string }

function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return p;
}

function levelText(lesson: Lesson, level: ExplanationLevel, levels: ExplanationLevel[]): string | undefined {
  if (lesson.explanations[level]) return lesson.explanations[level];
  const idx = levels.indexOf(level);
  for (let d = 1; d < levels.length; d++) {
    const lo = levels[idx - d];
    const hi = levels[idx + d];
    if (lo && lesson.explanations[lo]) return lesson.explanations[lo];
    if (hi && lesson.explanations[hi]) return lesson.explanations[hi];
  }
  return Object.values(lesson.explanations)[0];
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const { course, progress, level, actions, navigate } = useApp();
  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
  const moduleOf = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  const reading = progress.preferences.reducedChrome;
  const scroll = useScrollProgress();

  const [note, setNote] = useState('');
  const [teach, setTeach] = useState('');
  useEffect(() => {
    setNote(progress.notes[lessonId] ?? '');
    setTeach(progress.teachBack[lessonId] ?? '');
  }, [lessonId, progress.notes, progress.teachBack]);

  const next = useMemo(() => nextLesson(course, lessonId), [course, lessonId]);
  const prev = useMemo(() => prevLesson(course, lessonId), [course, lessonId]);

  // Keyboard navigation between lessons (ignoring text fields).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' && next) navigate({ name: 'lesson', lessonId: next.id });
      if (e.key === 'ArrowLeft' && prev) navigate({ name: 'lesson', lessonId: prev.id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, navigate]);

  if (!lesson || !moduleOf) return <p className="empty">Lesson not found.</p>;

  if (!isLessonAccessible(course, lessonId, progress)) {
    return (
      <div className="empty">
        <Icon name="Lock" size={28} className="empty-icon" />
        <h1>{lesson.title}</h1>
        <p>This lesson is locked. Finish the earlier modules to unlock it.</p>
        <button className="btn primary" onClick={() => navigate({ name: 'home' })}>Back to course</button>
      </div>
    );
  }

  const explanation = levelText(lesson, level, course.meta.levels);
  const levelIdx = course.meta.levels.indexOf(level);
  const simpler = course.meta.levels.slice(0, levelIdx).reverse().find((l) => lesson.explanations[l]);
  const deeper = course.meta.levels.slice(levelIdx + 1).find((l) => lesson.explanations[l]);
  const bookmarked = progress.bookmarks.includes(lessonId);
  const completed = progress.lessons[lessonId]?.completed ?? false;
  const coursePct = completionPercent(course, progress);

  const sections: Section[] = [];
  if (explanation) sections.push({ id: 'explanation', label: 'Overview', icon: 'BookOpen' });
  if (lesson.facets?.length) sections.push({ id: 'facets', label: 'The idea', icon: 'Lightbulb' });
  if (lesson.diagram) sections.push({ id: 'diagram', label: 'Diagram', icon: 'Network' });
  if (lesson.flow?.length) sections.push({ id: 'flow', label: 'Flow', icon: 'Route' });
  if (lesson.walkthrough?.length) sections.push({ id: 'walkthrough', label: 'Code', icon: 'Code2' });
  if (lesson.tech?.length) sections.push({ id: 'tech', label: 'Tech', icon: 'Cpu' });
  if (lesson.compare) sections.push({ id: 'compare', label: 'Compare', icon: 'Scale' });
  if (lesson.quiz?.length) sections.push({ id: 'quiz', label: 'Check', icon: 'HelpCircle' });
  if (lesson.exercise) sections.push({ id: 'exercise', label: 'Practice', icon: 'Dumbbell' });
  if (lesson.recap?.length) sections.push({ id: 'recap', label: 'Recap', icon: 'ListChecks' });

  return (
    <div className={`lesson ${reading ? 'reading' : ''}`}>
      <div className="lesson-topbar">
        <div className="bar">
          <span style={{ width: `${scroll}%` }} />
        </div>
        <div className="meta">
          <span>{coursePct}% of course complete</span>
          <button className="btn ghost" onClick={() => actions.setPreference('reducedChrome', !reading)}>
            <Icon name={reading ? 'Eye' : 'EyeOff'} size={14} /> {reading ? 'Show sidebar' : 'Reading mode'}
          </button>
        </div>
      </div>

      <div className="lesson-layout">
        <article className="lesson-main reveal">
          <p className="lesson-crumb">{moduleOf.title}</p>
          <div className="lesson-hero">
            <span className={`lh-icon kind-${lesson.kind}`}>
              <Icon name={lesson.icon} size={24} />
            </span>
            <div>
              <h1>{lesson.title}</h1>
              <div className="cover-meta">
                <span className={`badge kind-${lesson.kind}`}>{lesson.typeLabel}</span>
                {lesson.est && (
                  <span className="chip"><Icon name="Clock" size={13} /> {lesson.est} min</span>
                )}
                <button className={`btn ghost${bookmarked ? ' primary' : ''}`} aria-pressed={bookmarked} onClick={() => actions.toggleBookmark(lessonId)}>
                  <Icon name="Bookmark" size={14} /> {bookmarked ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {explanation && (
            <section id="explanation" className="lesson-section">
              <Markdown className="lesson-explanation" text={explanation} />
              {(simpler || deeper) && (
                <div className="cover-meta">
                  {simpler && (
                    <button className="btn ghost" onClick={() => actions.setPreference('explanationLevel', simpler)}>
                      <Icon name="ChevronDown" size={14} /> Simpler explanation
                    </button>
                  )}
                  {deeper && (
                    <button className="btn ghost" onClick={() => actions.setPreference('explanationLevel', deeper)}>
                      <Icon name="Layers" size={14} /> Go deeper
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {lesson.facets && lesson.facets.length > 0 && (
            <section id="facets" className="lesson-section">
              <h2><Icon name="Lightbulb" size={18} /> The idea, four ways</h2>
              <FacetSwitcher facets={lesson.facets} />
            </section>
          )}

          {lesson.diagram && (
            <section id="diagram" className="lesson-section">
              <h2><Icon name="Network" size={18} /> {lesson.diagram.title}</h2>
              <Mermaid code={lesson.diagram.code} title={lesson.diagram.title} />
            </section>
          )}

          {lesson.flow && lesson.flow.length > 0 && (
            <section id="flow" className="lesson-section">
              <h2><Icon name="Route" size={18} /> Step by step</h2>
              <FlowSteps steps={lesson.flow} />
            </section>
          )}

          {lesson.walkthrough && lesson.walkthrough.length > 0 && (
            <section id="walkthrough" className="lesson-section">
              <h2><Icon name="Code2" size={18} /> Code walkthrough</h2>
              <CodeWalkthrough steps={lesson.walkthrough} />
            </section>
          )}

          {lesson.tech && lesson.tech.length > 0 && (
            <section id="tech" className="lesson-section">
              <h2><Icon name="Cpu" size={18} /> Technologies</h2>
              <TechCards tech={lesson.tech} />
            </section>
          )}

          {lesson.compare && (
            <section id="compare" className="lesson-section">
              <h2><Icon name="Scale" size={18} /> Comparison</h2>
              <CompareTable data={lesson.compare} />
            </section>
          )}

          {lesson.callouts?.map((c, i) => <Callout key={i} data={c} />)}

          {lesson.sources && lesson.sources.length > 0 && (
            <section id="sources" className="lesson-section">
              <h2><Icon name="FileCode" size={18} /> Where this lives</h2>
              <div className="sources">
                {lesson.sources.map((s, i) => (
                  <div key={i} className="source">
                    <Icon name="FileCode" size={14} />
                    <code>{s.path}{s.lines ? `:${s.lines}` : ''}</code>
                    {s.note && <span className="source-note">{s.note}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.quiz?.map((q) => (
            <section id="quiz" className="lesson-section" key={q.id}>
              <QuizBlock quiz={q} />
            </section>
          ))}

          {lesson.exercise && (
            <section id="exercise" className="lesson-section">
              <div className="exercise">
                <h3><Icon name="Dumbbell" size={16} /> Hands-on challenge</h3>
                <Markdown text={lesson.exercise.prompt} />
                {lesson.exercise.checklist && (
                  <ul className="checklist">
                    {lesson.exercise.checklist.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                )}
                <label className="exercise-done">
                  <input
                    type="checkbox"
                    checked={progress.exercises[lesson.exercise.id]?.done ?? false}
                    onChange={(e) => actions.setExerciseDone(lesson.exercise!.id, e.target.checked, lesson.concepts)}
                  />
                  I completed this challenge
                </label>
              </div>
            </section>
          )}

          {lesson.teachBack && (
            <section className="lesson-section">
              <div className="teach-back">
                <h3><Icon name="Mic" size={16} /> Explain it in your own words</h3>
                <Markdown text={lesson.teachBack} />
                <textarea value={teach} placeholder="Type your explanation..." rows={4} onChange={(e) => setTeach(e.target.value)} onBlur={() => actions.setTeachBack(lessonId, teach)} />
              </div>
            </section>
          )}

          {lesson.deeper && (
            <Disclosure summary="Go deeper (optional)">
              <Markdown text={lesson.deeper} />
            </Disclosure>
          )}

          {lesson.recap && lesson.recap.length > 0 && (
            <section id="recap" className="lesson-section">
              <div className="recap">
                <h2><Icon name="ListChecks" size={18} /> Recap</h2>
                <ul>{lesson.recap.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </section>
          )}

          <section className="lesson-section">
            <h3><Icon name="Bookmark" size={16} /> Your notes</h3>
            <textarea value={note} placeholder="Private notes for this lesson..." rows={3} onChange={(e) => setNote(e.target.value)} onBlur={() => actions.setNote(lessonId, note)} />
          </section>

          <footer className="lesson-foot">
            <button className="btn ghost" disabled={!prev} onClick={() => prev && navigate({ name: 'lesson', lessonId: prev.id })}>
              <Icon name="ChevronLeft" size={16} /> Previous
            </button>
            <button className={`btn ${completed ? 'ghost' : ''}`} onClick={() => actions.completeLesson(lessonId, !completed)}>
              <Icon name={completed ? 'RotateCcw' : 'Check'} size={16} /> {completed ? 'Mark as not done' : 'Mark complete'}
            </button>
            {next ? (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ name: 'lesson', lessonId: next.id }); }}>
                Continue <Icon name="ChevronRight" size={16} />
              </button>
            ) : (
              <button className="btn primary" onClick={() => { if (!completed) actions.completeLesson(lessonId, true); navigate({ name: 'certificate' }); }}>
                Finish course <Icon name="Trophy" size={16} />
              </button>
            )}
          </footer>
          <p className="kbd-hint">Tip: use <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> to move between lessons.</p>
        </article>

        <aside className="lesson-toc" aria-label="On this page">
          <div className="toc-title">On this page</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.label}</a>
          ))}
        </aside>
      </div>
    </div>
  );
}
