// Pure helpers for unlocking, progress, and recommendations.

import { orderedLessons, type Course, type Lesson } from './schema';
import type { Progress } from './progress';
import { masteryLabel } from './mastery';

export function moduleCompleted(course: Course, moduleId: string, progress: Progress): boolean {
  const mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) return false;
  return mod.lessons.every((l) => progress.lessons[l.id]?.completed);
}

/**
 * Whether a module is open. Default locking is "recommended": nothing is hard
 * locked, so learners can preview ahead. "strict" locking (an opt-in course
 * setting) gates a module behind completing all earlier ones.
 */
export function isModuleUnlocked(course: Course, moduleId: string, progress: Progress): boolean {
  if (course.settings.locking !== 'strict') return true;
  const idx = course.modules.findIndex((m) => m.id === moduleId);
  if (idx <= 0) return true;
  return course.modules.slice(0, idx).every((m) => moduleCompleted(course, m.id, progress));
}

/** True when a module is ahead of the recommended sequence (preview only). */
export function isModuleAhead(course: Course, moduleId: string, progress: Progress): boolean {
  const idx = course.modules.findIndex((m) => m.id === moduleId);
  if (idx <= 0) return false;
  return !course.modules.slice(0, idx).every((m) => moduleCompleted(course, m.id, progress));
}

export function isLessonAccessible(course: Course, lessonId: string, progress: Progress): boolean {
  const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  return mod ? isModuleUnlocked(course, mod.id, progress) : false;
}

export function completionPercent(course: Course, progress: Progress): number {
  const lessons = orderedLessons(course);
  if (lessons.length === 0) return 0;
  const done = lessons.filter((l) => progress.lessons[l.id]?.completed).length;
  return Math.round((done / lessons.length) * 100);
}

export function isCourseComplete(course: Course, progress: Progress): boolean {
  return completionPercent(course, progress) === 100;
}

export function nextLesson(course: Course, lessonId: string): (Lesson & { moduleId: string }) | null {
  const lessons = orderedLessons(course);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1 || idx === lessons.length - 1) return null;
  return lessons[idx + 1];
}

export function prevLesson(course: Course, lessonId: string): (Lesson & { moduleId: string }) | null {
  const lessons = orderedLessons(course);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx <= 0) return null;
  return lessons[idx - 1];
}

export interface Recommendation {
  kind: 'review' | 'continue' | 'done';
  lessonId?: string;
  reason: string;
}

/** Suggest what to learn next: a struggling concept first, else the next gap. */
export function recommendNext(course: Course, progress: Progress): Recommendation {
  // 1. A concept that needs review.
  for (const concept of course.concepts ?? []) {
    const score = progress.mastery[concept.id] ?? 0;
    const attempts = Object.keys(progress.quizAttempts).length > 0;
    if (masteryLabel(score, attempts) === 'needs-review') {
      const lesson = course.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.concepts?.includes(concept.id));
      if (lesson) {
        return { kind: 'review', lessonId: lesson.id, reason: `Revisit "${concept.name}" to strengthen it.` };
      }
    }
  }
  // 2. The next incomplete, accessible lesson.
  for (const lesson of orderedLessons(course)) {
    if (!progress.lessons[lesson.id]?.completed && isLessonAccessible(course, lesson.id, progress)) {
      return { kind: 'continue', lessonId: lesson.id, reason: 'Continue where you left off.' };
    }
  }
  return { kind: 'done', reason: 'You have completed every lesson. Try the teach-back challenges.' };
}
