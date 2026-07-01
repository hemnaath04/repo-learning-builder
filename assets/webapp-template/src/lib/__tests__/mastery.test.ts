import { describe, it, expect } from 'vitest';
import type { Course } from '../schema';
import {
  quizItemScore, computeConceptMastery, scheduleReview, masteryLabel, isDue,
  initialReview, MASTERED, type MasteryInputs,
} from '../mastery';

// A small runtime course fixture with one concept backed by two quizzes, an
// exercise, and a teach-back, so mastery blending can be tested precisely.
const course: Course = {
  schemaVersion: 2,
  meta: { id: 'f', title: 'F', sourceType: 'topic', generatedAt: 'now', levels: ['beginner'], defaultLevel: 'beginner' },
  theme: { name: 'storybook' },
  settings: { locking: 'recommended' },
  concepts: [{ id: 'c1', name: 'Concept 1' }],
  glossary: [], tech: [], diagrams: [], repoMap: null,
  modules: [
    {
      id: 'm', title: 'M', order: 1,
      lessons: [
        {
          id: 'l', title: 'L', order: 1, archetype: 'concept', kind: 'quick', icon: 'Lightbulb',
          typeLabel: 'Concept', concepts: ['c1'], explanations: { beginner: 'x' },
          quiz: [
            { id: 'q1', question: 'a', options: ['a', 'b'], answerIndex: 0, explanation: 'because' },
            { id: 'q2', question: 'b', options: ['a', 'b'], answerIndex: 1, explanation: 'because' },
          ],
          exercise: { id: 'ex1', prompt: 'do it' },
          teachBack: 'explain',
        },
      ],
    },
  ],
};

function emptyInputs(): MasteryInputs {
  return { quizAttempts: {}, exercises: {}, teachBack: {} };
}

describe('quizItemScore', () => {
  it('returns null with no attempts', () => {
    expect(quizItemScore(undefined)).toBeNull();
    expect(quizItemScore([])).toBeNull();
  });
  it('rewards first-try correctness', () => {
    expect(quizItemScore([{ selected: 0, correct: true, at: 'a' }])).toBeGreaterThanOrEqual(0.9);
  });
  it('penalizes repeated mistakes', () => {
    const s = quizItemScore([
      { selected: 1, correct: false, at: 'a' },
      { selected: 1, correct: false, at: 'b' },
      { selected: 1, correct: false, at: 'c' },
    ])!;
    expect(s).toBeLessThan(0.3);
  });
});

describe('computeConceptMastery', () => {
  it('is zero with no evidence', () => {
    expect(computeConceptMastery('c1', course, emptyInputs())).toBe(0);
  });
  it('rises to mastery with two first-try correct quizzes', () => {
    const inputs = emptyInputs();
    inputs.quizAttempts.q1 = [{ selected: 0, correct: true, at: 'a' }];
    inputs.quizAttempts.q2 = [{ selected: 1, correct: true, at: 'a' }];
    expect(computeConceptMastery('c1', course, inputs)).toBeGreaterThanOrEqual(0.8);
  });
  it('blends exercises and teach-back as extra evidence', () => {
    const low: MasteryInputs = {
      quizAttempts: { q1: [{ selected: 1, correct: false, at: 'a' }], q2: [{ selected: 0, correct: false, at: 'a' }] },
      exercises: {}, teachBack: {},
    };
    const lowScore = computeConceptMastery('c1', course, low);
    const higher = computeConceptMastery('c1', course, {
      quizAttempts: low.quizAttempts,
      exercises: { ex1: { done: true } },
      teachBack: { l: 'A full explanation in my own words that shows real understanding.' },
    });
    expect(higher).toBeGreaterThan(lowScore);
  });
});

describe('masteryLabel', () => {
  it('labels by score and attempts', () => {
    expect(masteryLabel(0, false)).toBe('not-started');
    expect(masteryLabel(0.3, true)).toBe('needs-review');
    expect(masteryLabel(0.6, true)).toBe('progressing');
    expect(masteryLabel(MASTERED, true)).toBe('mastered');
  });
});

describe('spaced repetition', () => {
  const now = new Date('2026-06-30T00:00:00.000Z');
  it('grows on success and resets on failure', () => {
    const first = scheduleReview(initialReview(now), true, now);
    expect(first.intervalDays).toBe(1);
    const second = scheduleReview(first, true, now);
    expect(second.intervalDays).toBeGreaterThan(first.intervalDays);
    const failed = scheduleReview(second, false, now);
    expect(failed.intervalDays).toBe(1);
    expect(failed.ease).toBeLessThan(second.ease);
  });
  it('reports due state', () => {
    const s = scheduleReview(initialReview(now), true, now);
    expect(isDue(s, now)).toBe(false);
    expect(isDue(s, new Date('2026-07-05T00:00:00.000Z'))).toBe(true);
  });
});
