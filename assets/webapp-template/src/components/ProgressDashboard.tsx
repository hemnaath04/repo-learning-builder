import { useApp } from '../context/AppContext';
import { completionPercent, recommendNext, moduleCompleted } from '../lib/navigation';
import { masteryLabel } from '../lib/mastery';
import { learningStreak, quizAccuracy, exercisesCompleted, estimatedMinutesRemaining, recentConcepts, reviewConcepts } from '../lib/stats';
import { ProgressBar } from './ProgressBar';
import { Radar } from './Radar';
import { Icon } from './Icon';

export function ProgressDashboard() {
  const { course, progress, navigate } = useApp();
  if (!course || !progress) return null;
  const pct = completionPercent(course, progress);
  const rec = recommendNext(course, progress);
  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  const acc = quizAccuracy(progress);
  const streak = learningStreak(progress);
  const remaining = estimatedMinutesRemaining(course, progress);
  const recent = recentConcepts(course, progress);
  const review = reviewConcepts(course, progress);
  const radar = course.concepts.map((c) => ({ label: c.name, value: progress.mastery[c.id] ?? 0 }));
  const milestones = course.modules.map((m) => ({ text: m.title, done: moduleCompleted(course, m.id, progress) }));

  return (
    <div className="page reveal">
      <h1><Icon name="BarChart3" size={22} /> Your progress</h1>
      <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="identity-bar"><ProgressBar value={pct} label={`${pct}% complete`} /></div>
        <p style={{ margin: '10px 0 4px' }}><strong>Next:</strong> {rec.reason}</p>
        {rec.lessonId && <button className="btn primary" onClick={() => navigate({ view: 'lesson', lessonId: rec.lessonId! })}><Icon name="Play" size={15} /> Go there</button>}
      </div>

      <div className="dash-grid">
        <div className="stat-card"><h2><Icon name="Flame" size={15} /> Streak</h2><div className="stat-big">{streak}<span style={{ fontSize: 'var(--step-0)' }}> days</span></div></div>
        <div className="stat-card"><h2><Icon name="Target" size={15} /> Quiz accuracy</h2><div className="stat-big">{acc.pct}%</div><p className="muted">{acc.correct}/{acc.total} first try</p></div>
        <div className="stat-card"><h2><Icon name="Dumbbell" size={15} /> Activities</h2><div className="stat-big">{exercisesCompleted(progress)}</div></div>
        <div className="stat-card"><h2><Icon name="Timer" size={15} /> Time left</h2><div className="stat-big">~{remaining}<span style={{ fontSize: 'var(--step-0)' }}> min</span></div></div>
      </div>

      {course.concepts.length > 0 && (
        <div className="dash-grid" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="stat-card"><h2><Icon name="Network" size={15} /> Concept mastery</h2><Radar points={radar} /></div>
          <div className="stat-card"><h2><Icon name="ListChecks" size={15} /> By concept</h2>
            {course.concepts.map((c) => {
              const score = progress.mastery[c.id] ?? 0; const label = masteryLabel(score, hasAttempts);
              return (
                <div key={c.id} style={{ margin: '8px 0' }}>
                  <div className="stat-row" style={{ borderBottom: 'none', paddingBottom: 2 }}><span>{c.name}</span><span className={`mastery-label ${label}`}>{label.replace('-', ' ')}</span></div>
                  <ProgressBar value={score * 100} label={`${Math.round(score * 100)}%`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dash-grid" style={{ marginTop: 'var(--sp-4)' }}>
        <div className="stat-card"><h2><Icon name="Sparkles" size={15} /> Recently learned</h2>{recent.length ? <div className="chips-list">{recent.map((n) => <span key={n} className="chip">{n}</span>)}</div> : <p className="muted">Take a quiz to build mastery.</p>}</div>
        <div className="stat-card"><h2><Icon name="RotateCcw" size={15} /> Review queue</h2>{review.length ? <div className="chips-list">{review.map((n) => <span key={n} className="chip">{n}</span>)}</div> : <p className="muted">Nothing due. Nice.</p>}</div>
        <div className="stat-card"><h2><Icon name="Trophy" size={15} /> Milestones</h2>{milestones.map((m, i) => <div key={i} className="stat-row"><span>{m.text}</span><Icon name={m.done ? 'Check' : 'Circle'} size={14} /></div>)}</div>
      </div>
    </div>
  );
}
