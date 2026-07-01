import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Course } from '../schema';
import { loadCourse } from '../expand';
import { ProgressStore, storageKey, createProgress } from '../progress';
import { createMemoryBackend, type StorageBackend } from '../storage';

const raw = JSON.parse(readFileSync(new URL('../../../public/courses/claimfarm/course.json', import.meta.url), 'utf8'));
let course: Course;
let backend: StorageBackend;
beforeEach(() => { course = loadCourse(raw); backend = createMemoryBackend(); });

describe('progress persistence (stable ids)', () => {
  it('persists opens across store instances', () => {
    const s = new ProgressStore(course, backend);
    s.openLesson('l-story');
    const reopened = new ProgressStore(course, backend);
    expect(reopened.getState().currentLessonId).toBe('l-story');
  });

  it('records quiz attempts and derives concept mastery', () => {
    const s = new ProgressStore(course, backend);
    s.recordQuiz('chk-story', 1, true);
    expect(s.getState().quizAttempts['chk-story']).toHaveLength(1);
    expect(s.getState().mastery['c-story']).toBeGreaterThan(0);
  });

  it('tracks activity completion keyed by lesson id', () => {
    const s = new ProgressStore(course, backend);
    s.setExerciseDone('l-flow', true, ['c-journey']);
    expect(s.getState().exercises['l-flow'].done).toBe(true);
  });

  it('migrates progress on fingerprint change, keeping stable ids', () => {
    const s = new ProgressStore(course, backend);
    s.recordQuiz('chk-story', 1, true);
    s.toggleBookmark('l-channels');
    const stale = s.getState();
    stale.bookmarks.push('l-ghost');
    stale.quizAttempts['chk-ghost'] = [{ selected: 0, correct: false, at: 'now' }];
    backend.setItem(storageKey(course.meta.id), JSON.stringify(stale));
    const regen: Course = { ...course, meta: { ...course.meta, sourceFingerprint: 'new' } };
    const migrated = new ProgressStore(regen, backend).getState();
    expect(migrated.quizAttempts['chk-story']).toHaveLength(1); // kept
    expect(migrated.quizAttempts['chk-ghost']).toBeUndefined();  // dropped
    expect(migrated.bookmarks).toContain('l-channels');
    expect(migrated.sourceFingerprint).toBe('new');
  });

  it('exports and imports', () => {
    const s = new ProgressStore(course, backend);
    s.recordQuiz('chk-story', 1, true);
    const dump = s.exportJSON();
    s.reset();
    expect(s.getState().quizAttempts['chk-story']).toBeUndefined();
    s.importJSON(dump);
    expect(s.getState().quizAttempts['chk-story']).toHaveLength(1);
  });

  it('rejects import from a different course', () => {
    const s = new ProgressStore(course, backend);
    const other = createProgress(course); other.courseId = 'nope';
    expect(() => s.importJSON(JSON.stringify(other))).toThrow();
  });
});
