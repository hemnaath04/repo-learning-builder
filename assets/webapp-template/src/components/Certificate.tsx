import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { completionPercent, isCourseComplete, recommendNext } from '../lib/navigation';
import { masteryLabel } from '../lib/mastery';
import { quizAccuracy } from '../lib/stats';
import { Icon } from './Icon';

export function Certificate() {
  const { course, progress, navigate } = useApp();
  const [copied, setCopied] = useState(false);
  if (!course || !progress) return null;
  const pct = completionPercent(course, progress);
  const complete = isCourseComplete(course, progress);
  const rec = recommendNext(course, progress);
  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  const mastered = course.concepts.filter((c) => masteryLabel(progress.mastery[c.id] ?? 0, hasAttempts) === 'mastered');
  const acc = quizAccuracy(progress);

  const share = async () => {
    const text = `I completed "${course.meta.title}" — ${pct}% done, ${mastered.length}/${course.concepts.length} concepts mastered, ${acc.pct}% quiz accuracy.`;
    try {
      if (navigator.share) await navigator.share({ title: course.meta.title, text });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="page centered reveal">
      <div className="card" style={{ maxWidth: 620, textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--primary)' }}>{complete ? 'Course complete' : 'Progress summary'}</p>
        <h1>{course.meta.title}</h1>
        <p>{complete ? 'You reached every landmark on the atlas. Beautifully done.' : `You have explored ${pct}% of this atlas.`}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-7)', margin: 'var(--sp-5) 0' }}>
          <div><div className="eyebrow">Lessons</div><div className="stat-big">{pct}%</div></div>
          <div><div className="eyebrow">Mastered</div><div className="stat-big">{mastered.length}/{course.concepts.length || 0}</div></div>
          <div><div className="eyebrow">Accuracy</div><div className="stat-big">{acc.pct}%</div></div>
        </div>
        <p className="muted">{rec.reason}</p>
        <div className="identity-actions" style={{ justifyContent: 'center' }}>
          {rec.lessonId && <button className="btn primary" onClick={() => navigate({ view: 'lesson', lessonId: rec.lessonId! })}><Icon name="Play" size={15} /> Keep going</button>}
          <button className="btn" onClick={share}><Icon name="Sparkles" size={14} /> {copied ? 'Copied!' : 'Share'}</button>
          <button className="btn ghost" onClick={() => navigate({ view: 'atlas' })}><Icon name="Map" size={14} /> Atlas</button>
        </div>
      </div>
    </div>
  );
}
