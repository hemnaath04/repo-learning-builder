import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { completionPercent, isCourseComplete, recommendNext } from '../lib/navigation';
import { masteryLabel } from '../lib/mastery';
import { quizAccuracy, learningStreak } from '../lib/stats';
import { Icon } from './Icon';

export function Certificate() {
  const { course, progress, navigate } = useApp();
  const [copied, setCopied] = useState(false);
  const pct = completionPercent(course, progress);
  const complete = isCourseComplete(course, progress);
  const rec = recommendNext(course, progress);
  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  const mastered = course.concepts.filter((c) => masteryLabel(progress.mastery[c.id] ?? 0, hasAttempts) === 'mastered');
  const acc = quizAccuracy(progress);

  const share = async () => {
    const text = `I completed "${course.meta.title}" — ${pct}% done, ${mastered.length}/${course.concepts.length} concepts mastered, ${acc.pct}% quiz accuracy, ${learningStreak(progress)}-day streak.`;
    try {
      if (navigator.share) await navigator.share({ title: course.meta.title, text });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="certificate reveal">
      <div className="cert-card">
        <p className="cert-kicker">{complete ? 'Course complete' : 'Progress summary'}</p>
        <h1>{course.meta.title}</h1>
        <p>{complete ? 'You finished every lesson. Beautifully done.' : `You have completed ${pct}% of this course.`}</p>
        <dl className="cert-stats">
          <div><dt>Lessons</dt><dd>{pct}%</dd></div>
          <div><dt>Concepts mastered</dt><dd>{mastered.length}/{course.concepts.length || 0}</dd></div>
          <div><dt>Quiz accuracy</dt><dd>{acc.pct}%</dd></div>
        </dl>
        <div className="section-title" style={{ justifyContent: 'center', position: 'relative' }}>
          <Icon name="Sparkles" size={16} /><h2 style={{ fontSize: 'var(--step-0)' }}>What should I learn next?</h2>
        </div>
        <p style={{ position: 'relative' }}>{rec.reason}</p>
        <div className="cert-actions cover-meta" style={{ justifyContent: 'center', position: 'relative' }}>
          {rec.lessonId && <button className="btn primary" onClick={() => navigate({ name: 'lesson', lessonId: rec.lessonId! })}><Icon name="Play" size={16} /> Keep going</button>}
          <button className="btn" onClick={share}><Icon name="Sparkles" size={15} /> {copied ? 'Copied!' : 'Share'}</button>
          <button className="btn ghost" onClick={() => window.print()}><Icon name="Download" size={15} /> Print</button>
          <button className="btn ghost" onClick={() => navigate({ name: 'dashboard' })}><Icon name="BarChart3" size={15} /> Dashboard</button>
        </div>
      </div>
    </div>
  );
}
