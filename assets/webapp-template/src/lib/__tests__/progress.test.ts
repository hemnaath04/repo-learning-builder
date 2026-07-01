import { describe, it, expect, beforeEach } from 'vitest';
import type { Course } from '../schema';
import { loadCourse } from '../expand';
import { ProgressStore, storageKey, createProgress } from '../progress';
import { createMemoryBackend, type StorageBackend } from '../storage';
import raw from '../../data';

let course: Course;
let backend: StorageBackend;

beforeEach(() => {
  course = loadCourse(raw);
  backend = createMemoryBackend();
});

describe('progress persistence', () => {
  it('persists lesson opens across store instances', () => {
    const store = new ProgressStore(course, backend);
    expect(store.getState().currentLessonId).toBeNull();
    store.openLesson('l-story');
    const reopened = new ProgressStore(course, backend);
    expect(reopened.getState().currentLessonId).toBe('l-story');
    expect(reopened.getState().lessons['l-story'].opened).toBe(true);
  });

  it('writes under the course-scoped key', () => {
    const store = new ProgressStore(course, backend);
    store.openLesson('l-story');
    expect(backend.getItem(storageKey(course.meta.id))).not.toBeNull();
  });

  it('records quiz attempts and completes lessons', () => {
    const store = new ProgressStore(course, backend);
    store.recordQuiz('q-story-1', 1, true);
    store.completeLesson('l-story');
    const s = store.getState();
    expect(s.quizAttempts['q-story-1']).toHaveLength(1);
    expect(s.lessons['l-story'].completed).toBe(true);
  });

  it('updates concept mastery after a correct quiz', () => {
    const store = new ProgressStore(course, backend);
    store.recordQuiz('q-story-1', 1, true);
    store.recordQuiz('q-story-2', 1, true);
    expect(store.getState().mastery['c-story']).toBeGreaterThan(0);
  });

  it('exports, resets, and imports', () => {
    const store = new ProgressStore(course, backend);
    store.recordQuiz('q-story-1', 1, true);
    const exported = store.exportJSON();
    store.reset();
    expect(store.getState().quizAttempts['q-story-1']).toBeUndefined();
    store.importJSON(exported);
    expect(store.getState().quizAttempts['q-story-1']).toHaveLength(1);
  });

  it('rejects importing progress from a different course', () => {
    const store = new ProgressStore(course, backend);
    const other = createProgress(course);
    other.courseId = 'someone-else';
    expect(() => store.importJSON(JSON.stringify(other))).toThrow();
  });

  it('migrates progress when the fingerprint changes, dropping unknown ids', () => {
    const store = new ProgressStore(course, backend);
    store.recordQuiz('q-story-1', 1, true);
    store.toggleBookmark('l-arch');
    const stale = store.getState();
    stale.bookmarks.push('l-ghost');
    stale.quizAttempts['q-ghost'] = [{ selected: 0, correct: false, at: 'now' }];
    backend.setItem(storageKey(course.meta.id), JSON.stringify(stale));

    const regenerated: Course = { ...course, meta: { ...course.meta, sourceFingerprint: 'new-fingerprint' } };
    const migrated = new ProgressStore(regenerated, backend);
    const s = migrated.getState();
    expect(s.quizAttempts['q-story-1']).toHaveLength(1);
    expect(s.quizAttempts['q-ghost']).toBeUndefined();
    expect(s.bookmarks).toContain('l-arch');
    expect(s.bookmarks).not.toContain('l-ghost');
    expect(s.sourceFingerprint).toBe('new-fingerprint');
  });
});
