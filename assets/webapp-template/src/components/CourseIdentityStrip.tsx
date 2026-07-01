import { useApp } from '../context/AppContext';
import { completionPercent, recommendNext } from '../lib/navigation';
import { courseInitials } from '../lib/landmarks';
import { Icon } from './Icon';

// Compact 112px course header row: coral mark, eyebrow, title, metadata, actions.
export function CourseIdentityStrip() {
  const { course, progress, navigate } = useApp();
  if (!course || !progress) return null;
  const pct = completionPercent(course, progress);
  const rec = recommendNext(course, progress);
  const isRepo = course.meta.sourceType === 'repository' || course.meta.sourceType === 'github-url';
  const eyebrow = `${isRepo ? 'REPOSITORY COURSE' : 'TOPIC COURSE'}${course.meta.sourceRef ? ` · ${course.meta.sourceRef.toUpperCase()}` : ''}`;
  const meta = [
    course.meta.estimatedMinutes ? `${course.meta.estimatedMinutes} minutes` : null,
    `${course.modules.length} landmarks`,
    course.meta.audience,
  ].filter(Boolean).join(' · ');

  return (
    <section className="identity reveal">
      <span className="identity-mark">{courseInitials(course.meta.title)}</span>
      <div className="identity-text">
        <p className="identity-eyebrow">{eyebrow}</p>
        <h1 className="identity-title">{course.meta.title}</h1>
        <p className="identity-meta">{meta}</p>
      </div>
      <div className="identity-actions">
        <button className="btn-secondary" onClick={() => navigate({ view: 'settings' })}>Change level</button>
        {rec.lessonId && (
          <button className="btn-primary" onClick={() => navigate({ view: 'lesson', lessonId: rec.lessonId! })}>
            <Icon name={pct > 0 ? 'Play' : 'Sparkles'} size={15} />
            {pct > 0 ? 'Continue learning' : 'Start at landmark 01'}
          </button>
        )}
      </div>
    </section>
  );
}
