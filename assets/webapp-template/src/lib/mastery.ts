// Mastery estimation and lightweight spaced repetition.
// A concept is mastered through demonstrated understanding (quizzes, exercises,
// teach-back), never merely by opening a lesson. See references/progress-model.md.

import type { Course } from './schema';

export interface QuizAttempt {
  selected: number;
  correct: boolean;
  at: string;
}

export interface ReviewState {
  due: string; // ISO
  intervalDays: number;
  ease: number;
  streak: number;
}

export interface MasteryInputs {
  quizAttempts: Record<string, QuizAttempt[]>;
  exercises: Record<string, { done: boolean }>;
  teachBack: Record<string, string>;
}

export const MASTERED = 0.8;
export const NEEDS_REVIEW = 0.5;

const WEIGHTS = { quiz: 0.6, exercise: 0.25, teachBack: 0.15 };

function clamp(n: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Score a single quiz item's attempts in [0,1], or null when never attempted. */
export function quizItemScore(attempts: QuizAttempt[] | undefined): number | null {
  if (!attempts || attempts.length === 0) return null;
  // Recency-weighted accuracy: later attempts carry more weight.
  let weightSum = 0;
  let acc = 0;
  attempts.forEach((a, i) => {
    const w = i + 1;
    weightSum += w;
    acc += w * (a.correct ? 1 : 0);
  });
  let score = acc / weightSum;
  // First-try correct is strong evidence of understanding.
  if (attempts[0].correct) score = Math.max(score, 0.9);
  // Repeated mistakes lower the score.
  const wrong = attempts.filter((a) => !a.correct).length;
  if (wrong >= 2) score -= 0.1 * (wrong - 1);
  return clamp(score);
}

/** Collect the quiz / exercise / teach-back ids that belong to a concept. */
export function conceptArtifacts(conceptId: string, course: Course): {
  quizIds: string[];
  exerciseIds: string[];
  teachBackLessonIds: string[];
} {
  const quizIds: string[] = [];
  const exerciseIds: string[] = [];
  const teachBackLessonIds: string[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.concepts?.includes(conceptId)) continue;
      for (const q of lesson.quiz ?? []) quizIds.push(q.id);
      if (lesson.activity) exerciseIds.push(lesson.id); // activity completion keyed by lesson id
      if (lesson.teachBack) teachBackLessonIds.push(lesson.id);
    }
  }
  return { quizIds, exerciseIds, teachBackLessonIds };
}

function teachBackSubstance(answer: string | undefined): number {
  if (!answer) return 0;
  const len = answer.trim().length;
  if (len >= 40) return 1;
  if (len >= 15) return 0.6;
  if (len > 0) return 0.3;
  return 0;
}

/** Estimate mastery of a concept in [0,1] from all available evidence. */
export function computeConceptMastery(
  conceptId: string,
  course: Course,
  inputs: MasteryInputs,
): number {
  const { quizIds, exerciseIds, teachBackLessonIds } = conceptArtifacts(conceptId, course);

  const quizScores = quizIds
    .map((id) => quizItemScore(inputs.quizAttempts[id]))
    .filter((s): s is number => s !== null);
  const quizScore = quizScores.length
    ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
    : null;

  // Exercises and teach-backs only count once the learner has acted on them.
  // Untouched ones are absent evidence, not negative evidence, so they are
  // excluded from the blend (see references/progress-model.md).
  const doneCount = exerciseIds.filter((id) => inputs.exercises[id]?.done).length;
  const exerciseScore = exerciseIds.length && doneCount > 0 ? doneCount / exerciseIds.length : null;

  const answered = teachBackLessonIds.filter((id) => (inputs.teachBack[id] ?? '').trim().length > 0);
  const teachBackScore = answered.length
    ? answered.map((id) => teachBackSubstance(inputs.teachBack[id])).reduce((a, b) => a + b, 0) /
      answered.length
    : null;

  // Renormalize weights across the components that have evidence.
  const parts: Array<[number, number]> = [];
  if (quizScore !== null) parts.push([WEIGHTS.quiz, quizScore]);
  if (exerciseScore !== null) parts.push([WEIGHTS.exercise, exerciseScore]);
  if (teachBackScore !== null) parts.push([WEIGHTS.teachBack, teachBackScore]);
  if (parts.length === 0) return 0;
  const totalWeight = parts.reduce((a, [w]) => a + w, 0);
  const weighted = parts.reduce((a, [w, s]) => a + w * s, 0);
  return clamp(weighted / totalWeight);
}

export type MasteryLabel = 'not-started' | 'needs-review' | 'progressing' | 'mastered';

export function masteryLabel(score: number, hasAttempts: boolean): MasteryLabel {
  if (!hasAttempts && score === 0) return 'not-started';
  if (score >= MASTERED) return 'mastered';
  if (score < NEEDS_REVIEW) return 'needs-review';
  return 'progressing';
}

export function initialReview(now: Date = new Date()): ReviewState {
  return { due: now.toISOString(), intervalDays: 0, ease: 2.5, streak: 0 };
}

/** SM-2 inspired update. Success grows the interval; failure resets it. */
export function scheduleReview(
  state: ReviewState | undefined,
  success: boolean,
  now: Date = new Date(),
): ReviewState {
  const prev = state ?? initialReview(now);
  let { intervalDays, ease, streak } = prev;
  if (success) {
    streak += 1;
    intervalDays = intervalDays <= 0 ? 1 : Math.round(intervalDays * ease);
    ease = Math.min(2.8, ease + 0.1);
  } else {
    streak = 0;
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
  }
  const due = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { due: due.toISOString(), intervalDays, ease, streak };
}

export function isDue(state: ReviewState | undefined, now: Date = new Date()): boolean {
  if (!state) return false;
  return new Date(state.due).getTime() <= now.getTime();
}
