import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { completionPercent, recommendNext, moduleCompleted } from '../lib/navigation';
import { masteryLabel } from '../lib/mastery';
import {
  learningStreak, quizAccuracy, exercisesCompleted, estimatedMinutesRemaining,
  recentConcepts, reviewConcepts,
} from '../lib/stats';
import { ProgressBar } from './ProgressBar';
import { Radar } from './Radar';
import { Icon } from './Icon';

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const { course, progress, actions, navigate } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shared, setShared] = useState(false);

  const pct = completionPercent(course, progress);
  const rec = recommendNext(course, progress);
  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  const acc = quizAccuracy(progress);
  const streak = learningStreak(progress);
  const remaining = estimatedMinutesRemaining(course, progress);
  const recent = recentConcepts(course, progress);
  const review = reviewConcepts(course, progress);
  const exDone = exercisesCompleted(progress);

  const radarPoints = course.concepts.map((c) => ({ label: c.name, value: progress.mastery[c.id] ?? 0 }));
  const milestones = course.modules.filter((m) => m.milestone).map((m) => ({ text: m.milestone!, done: moduleCompleted(course, m.id, progress) }));

  const onImport = async (file: File) => {
    try { actions.importJSON(await file.text()); } catch (e) { alert(`Import failed: ${(e as Error).message}`); }
  };

  const share = async () => {
    const text = `I'm ${pct}% through "${course.meta.title}" with a ${streak}-day streak and ${acc.pct}% quiz accuracy.`;
    try {
      if (navigator.share) await navigator.share({ title: course.meta.title, text });
      else { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="dashboard reveal">
      <h1><Icon name="BarChart3" size={22} /> Your progress</h1>

      <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="cover-progress"><ProgressBar value={pct} label={`${pct}% complete`} /></div>
        <div className="section-title" style={{ margin: 'var(--sp-3) 0 0' }}>
          <Icon name="Sparkles" size={16} />
          <h2 style={{ fontSize: 'var(--step-0)' }}>Recommended next</h2>
        </div>
        <p style={{ margin: '4px 0' }}>{rec.reason}</p>
        {rec.lessonId && (
          <button className="btn primary" onClick={() => navigate({ name: 'lesson', lessonId: rec.lessonId! })}>
            <Icon name="Play" size={16} /> Go there
          </button>
        )}
      </div>

      <div className="dash-grid">
        <div className="stat-card">
          <h2><Icon name="Flame" size={16} /> Streak</h2>
          <div className="stat-big">{streak}<span style={{ fontSize: 'var(--step-0)' }}> days</span></div>
        </div>
        <div className="stat-card">
          <h2><Icon name="Target" size={16} /> Quiz accuracy</h2>
          <div className="stat-big">{acc.pct}%</div>
          <p className="muted">{acc.correct} of {acc.total} first-try correct</p>
        </div>
        <div className="stat-card">
          <h2><Icon name="Dumbbell" size={16} /> Exercises</h2>
          <div className="stat-big">{exDone}</div>
          <p className="muted">completed challenges</p>
        </div>
        <div className="stat-card">
          <h2><Icon name="Timer" size={16} /> Time left</h2>
          <div className="stat-big">~{remaining}<span style={{ fontSize: 'var(--step-0)' }}> min</span></div>
        </div>
      </div>

      {course.concepts.length > 0 && (
        <div className="dash-grid" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="stat-card">
            <h2><Icon name="Network" size={16} /> Concept mastery</h2>
            <Radar points={radarPoints} />
          </div>
          <div className="stat-card">
            <h2><Icon name="ListChecks" size={16} /> By concept</h2>
            {course.concepts.map((c) => {
              const score = progress.mastery[c.id] ?? 0;
              const label = masteryLabel(score, hasAttempts);
              return (
                <div key={c.id} style={{ margin: '8px 0' }}>
                  <div className="stat-row" style={{ borderBottom: 'none', paddingBottom: 2 }}>
                    <span>{c.name}</span>
                    <span className={`mastery-label ${label}`}>{label.replace('-', ' ')}</span>
                  </div>
                  <ProgressBar value={score * 100} label={`${Math.round(score * 100)}%`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dash-grid" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="stat-card">
          <h2><Icon name="Sparkles" size={16} /> Recently learned</h2>
          {recent.length ? <div className="chips-list">{recent.map((n) => <span key={n} className="chip">{n}</span>)}</div> : <p className="muted">Complete a quiz to start building mastery.</p>}
        </div>
        <div className="stat-card">
          <h2><Icon name="RotateCcw" size={16} /> Review queue</h2>
          {review.length ? <div className="chips-list">{review.map((n) => <span key={n} className="chip">{n}</span>)}</div> : <p className="muted">Nothing due for review. Nice.</p>}
        </div>
        {milestones.length > 0 && (
          <div className="stat-card">
            <h2><Icon name="Trophy" size={16} /> Milestones</h2>
            {milestones.map((m, i) => (
              <div key={i} className="stat-row">
                <span>{m.text}</span>
                <Icon name={m.done ? 'Check' : 'Circle'} size={15} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 'var(--sp-5)' }}>
        <h2 style={{ fontSize: 'var(--step-0)' }}><Icon name="ShieldCheck" size={16} /> Your data</h2>
        <p className="muted">Progress is stored on this device. Export it to move between browsers.</p>
        <div className="cover-meta">
          <button className="btn" onClick={share}><Icon name="Sparkles" size={15} /> {shared ? 'Copied!' : 'Share summary'}</button>
          <button className="btn" onClick={() => download(`${course.meta.id}-progress.json`, actions.exportJSON())}><Icon name="Download" size={15} /> Export</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="Upload" size={15} /> Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          <button className="btn danger" onClick={() => { if (confirm('Reset all progress for this course?')) actions.reset(); }}><Icon name="RotateCcw" size={15} /> Reset</button>
        </div>
      </div>
    </div>
  );
}
