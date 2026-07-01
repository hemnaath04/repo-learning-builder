import { useApp } from '../context/AppContext';
import {
  completionPercent,
  recommendNext,
  moduleCompleted,
  isModuleAhead,
  isLessonAccessible,
} from '../lib/navigation';
import { learningStreak } from '../lib/stats';
import { ProgressBar } from './ProgressBar';
import { Icon } from './Icon';

export function HomePage() {
  const { course, progress, navigate } = useApp();
  const pct = completionPercent(course, progress);
  const rec = recommendNext(course, progress);
  const started = pct > 0;
  const streak = learningStreak(progress);

  const flowLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.flow && l.flow.length);
  const isRepo = course.meta.sourceType === 'repository' || course.meta.sourceType === 'github-url';
  const eyebrow = isRepo ? 'Repository course' : course.meta.sourceType === 'topic' ? 'Topic course' : 'Interactive course';

  return (
    <div className="home reveal">
      <section className="cover">
        <div className="cover-inner">
          <p className="cover-eyebrow">
            <span className="tick" aria-hidden /> {eyebrow}
            {course.meta.sourceRef ? ` · ${course.meta.sourceRef}` : ''}
          </p>
          <h1>{course.meta.title}</h1>
          {course.meta.promise ? (
            <p className="promise">{course.meta.promise}</p>
          ) : (
            course.meta.subtitle && <p className="promise">{course.meta.subtitle}</p>
          )}
          <div className="cover-meta">
            {course.meta.estimatedMinutes && (
              <span className="chip">
                <Icon name="Clock" size={14} /> ~{course.meta.estimatedMinutes} min
              </span>
            )}
            {course.meta.audience && (
              <span className="chip">
                <Icon name="GraduationCap" size={14} /> {course.meta.audience}
              </span>
            )}
            <span className="chip">
              <Icon name="Layers" size={14} /> {course.modules.length} modules
            </span>
            {streak > 0 && (
              <span className="chip">
                <Icon name="Flame" size={14} /> {streak} day streak
              </span>
            )}
          </div>
          <div className="cover-progress">
            <ProgressBar value={pct} label={`${pct}%`} />
          </div>
          <div className="cover-actions">
            {rec.lessonId && (
              <button className="btn primary lg" onClick={() => navigate({ name: 'lesson', lessonId: rec.lessonId! })}>
                <Icon name={started ? 'Play' : 'Sparkles'} size={18} />
                {started ? 'Continue learning' : 'Start the course'}
              </button>
            )}
            <button className="btn ghost lg" onClick={() => navigate({ name: 'overview' })}>
              Overview
            </button>
            {isRepo && (
              <button className="btn ghost lg" onClick={() => navigate({ name: 'explorer' })}>
                <Icon name="FolderTree" size={18} /> Explore the repo
              </button>
            )}
          </div>
          <p className="muted">{rec.reason}</p>
        </div>
      </section>

      {course.meta.outcomes && course.meta.outcomes.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="Target" size={18} />
            <h2>You will be able to</h2>
          </div>
          <div className="outcomes">
            {course.meta.outcomes.map((o, i) => (
              <div key={i} className="outcome">
                <span className="oc-num">{i + 1}</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {course.tech.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="Cpu" size={18} />
            <h2>Built with</h2>
          </div>
          <div className="techbadges">
            {course.tech.slice(0, 10).map((t) => (
              <span key={t.id} className="techbadge">
                <Icon name="Wrench" size={13} /> {t.name}
              </span>
            ))}
          </div>
        </>
      )}

      {isRepo && flowLesson?.flow && (
        <>
          <div className="section-title">
            <Icon name="Route" size={18} />
            <h2>How one request flows</h2>
          </div>
          <div className="flowpreview">
            {flowLesson.flow.slice(0, 6).map((s, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="flow-chip" style={{ animationDelay: `${i * 0.25}s` }}>
                  {s.actor}
                </span>
                {i < Math.min(arr.length, 6) - 1 && <Icon name="ArrowRight" size={16} className="flow-arrow" />}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="section-title">
        <Icon name="Map" size={18} />
        <h2>Your learning path</h2>
      </div>
      <div className="path">
        {course.modules.map((mod, mi) => {
          const done = moduleCompleted(course, mod.id, progress);
          const ahead = isModuleAhead(course, mod.id, progress);
          const current = !done && !ahead;
          return (
            <div key={mod.id}>
              <div className={`path-node ${done ? 'done' : current ? 'current' : ''}`}>
                <div className="path-rail">
                  <span className="path-bullet">
                    {done ? <Icon name="Check" size={18} /> : <Icon name={mod.icon || 'BookOpen'} size={18} />}
                  </span>
                  <span className="path-line" />
                </div>
                <div className={`path-card ${ahead ? 'locked' : ''}`}>
                  <div className="path-head">
                    <h3>
                      {mi + 1}. {mod.title}
                    </h3>
                    {ahead && (
                      <span className="chip">
                        <Icon name="Eye" size={13} /> preview
                      </span>
                    )}
                    {done && (
                      <span className="badge kind-project">
                        <Icon name="Check" size={12} /> done
                      </span>
                    )}
                  </div>
                  {mod.summary && <p className="muted">{mod.summary}</p>}
                  <ul className="path-lessons">
                    {mod.lessons.map((l) => {
                      const accessible = isLessonAccessible(course, l.id, progress);
                      const lp = progress.lessons[l.id];
                      return (
                        <li key={l.id}>
                          <button
                            className="path-lesson"
                            disabled={!accessible}
                            onClick={() => navigate({ name: 'lesson', lessonId: l.id })}
                          >
                            <Icon name={lp?.completed ? 'Check' : l.icon} size={13} />
                            {l.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              {mod.milestone && (
                <p className="milestone">
                  <Icon name="Trophy" size={16} /> {mod.milestone}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
