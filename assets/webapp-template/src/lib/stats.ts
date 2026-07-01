// Derived learning statistics for the progress dashboard. Pure functions over a
// Course + Progress so they are easy to test and free of UI concerns.

import { orderedLessons, type Course } from './schema';
import type { Progress } from './progress';
import { isDue, masteryLabel } from './mastery';

const DAY = 24 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with any completed lesson. */
export function learningStreak(progress: Progress, now: Date = new Date()): number {
  const days = new Set<string>();
  for (const lp of Object.values(progress.lessons)) {
    if (lp.completedAt) days.add(dayKey(lp.completedAt));
    else if (lp.openedAt) days.add(dayKey(lp.openedAt));
  }
  if (days.size === 0) return 0;
  let streak = 0;
  // Allow the streak to count from today or yesterday so a mid-day check holds.
  let cursor = new Date(now);
  if (!days.has(dayKey(cursor.toISOString()))) cursor = new Date(now.getTime() - DAY);
  while (days.has(dayKey(cursor.toISOString()))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY);
  }
  return streak;
}

export function quizAccuracy(progress: Progress): { correct: number; total: number; pct: number } {
  let correct = 0;
  let total = 0;
  for (const attempts of Object.values(progress.quizAttempts)) {
    if (attempts.length === 0) continue;
    total++;
    if (attempts[0].correct) correct++; // first-try accuracy
  }
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
}

export function exercisesCompleted(progress: Progress): number {
  return Object.values(progress.exercises).filter((e) => e.done).length;
}

export function estimatedMinutesRemaining(course: Course, progress: Progress): number {
  return orderedLessons(course)
    .filter((l) => !progress.lessons[l.id]?.completed)
    .reduce((sum, l) => sum + (l.est ?? 6), 0);
}

export function recentConcepts(course: Course, progress: Progress, limit = 4): string[] {
  const hasAttempts = Object.keys(progress.quizAttempts).length > 0;
  return course.concepts
    .filter((c) => {
      const label = masteryLabel(progress.mastery[c.id] ?? 0, hasAttempts);
      return label === 'progressing' || label === 'mastered';
    })
    .slice(0, limit)
    .map((c) => c.name);
}

export function reviewConcepts(course: Course, progress: Progress): string[] {
  return course.concepts.filter((c) => isDue(progress.review[c.id])).map((c) => c.name);
}
