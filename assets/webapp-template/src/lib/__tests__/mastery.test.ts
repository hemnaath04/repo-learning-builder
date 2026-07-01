import { describe, it, expect } from 'vitest';
import type { Course } from '../schema';
import { quizItemScore, computeConceptMastery, scheduleReview, masteryLabel, initialReview, isDue, MASTERED, type MasteryInputs } from '../mastery';

const course: Course = {
  schemaVersion: 3,
  meta: { id: 'f', title: 'F', sourceType: 'topic', generatedAt: 'n', levels: ['beginner'], defaultLevel: 'beginner' },
  concepts: [{ id: 'c1', name: 'C1' }], technologies: [], glossary: [], diagrams: [], repoMap: null,
  modules: [{ id: 'm', title: 'M', lessons: [{
    id: 'l', title: 'L', type: 'concept', typeLabel: 'Concept', icon: 'Lightbulb', concepts: ['c1'],
    quiz: [{ id: 'q1', question: 'a', options: ['a', 'b'], answerIndex: 0, explanation: 'x' }, { id: 'q2', question: 'b', options: ['a', 'b'], answerIndex: 1, explanation: 'x' }],
    activity: 'do it', teachBack: 'explain',
  }] }],
};
const empty = (): MasteryInputs => ({ quizAttempts: {}, exercises: {}, teachBack: {} });

describe('mastery', () => {
  it('scores first-try correctness high and repeated mistakes low', () => {
    expect(quizItemScore([{ selected: 0, correct: true, at: 'a' }])!).toBeGreaterThanOrEqual(0.9);
    expect(quizItemScore([{ selected: 1, correct: false, at: 'a' }, { selected: 1, correct: false, at: 'b' }, { selected: 1, correct: false, at: 'c' }])!).toBeLessThan(0.3);
  });
  it('is zero without evidence and rises with correct quizzes', () => {
    expect(computeConceptMastery('c1', course, empty())).toBe(0);
    const inp = empty(); inp.quizAttempts.q1 = [{ selected: 0, correct: true, at: 'a' }]; inp.quizAttempts.q2 = [{ selected: 1, correct: true, at: 'a' }];
    expect(computeConceptMastery('c1', course, inp)).toBeGreaterThanOrEqual(0.8);
  });
  it('blends activity (by lesson id) and teach-back', () => {
    const low: MasteryInputs = { quizAttempts: { q1: [{ selected: 1, correct: false, at: 'a' }], q2: [{ selected: 0, correct: false, at: 'a' }] }, exercises: {}, teachBack: {} };
    const lo = computeConceptMastery('c1', course, low);
    const hi = computeConceptMastery('c1', course, { quizAttempts: low.quizAttempts, exercises: { l: { done: true } }, teachBack: { l: 'A real own-words explanation that shows understanding.' } });
    expect(hi).toBeGreaterThan(lo);
  });
  it('labels and schedules review', () => {
    expect(masteryLabel(MASTERED, true)).toBe('mastered');
    const now = new Date('2026-07-01T00:00:00Z');
    const a = scheduleReview(initialReview(now), true, now);
    const b = scheduleReview(a, true, now);
    expect(b.intervalDays).toBeGreaterThan(a.intervalDays);
    expect(isDue(a, new Date('2026-07-10T00:00:00Z'))).toBe(true);
  });
});
