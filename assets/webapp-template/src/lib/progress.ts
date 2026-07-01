// Learner progress: persistence, mutations, and derived mastery. Independent of
// any Claude conversation. See references/progress-model.md.

import type { Course, ExplanationLevel, Lesson } from './schema';
import {
  computeConceptMastery,
  scheduleReview,
  type MasteryInputs,
  type QuizAttempt,
  type ReviewState,
} from './mastery';
import {
  getDefaultBackend,
  readJSON,
  writeJSON,
  type StorageBackend,
} from './storage';

export type ThemePref = 'light' | 'dark' | 'system';

export interface Preferences {
  explanationLevel: ExplanationLevel;
  theme: ThemePref;
  themeName: string; // 'auto' or a ThemeName; 'auto' follows the course category
  teachingStyle: string;
  reducedChrome: boolean; // reading mode preference
}

export interface LessonProgress {
  opened: boolean;
  completed: boolean;
  openedAt: string | null;
  completedAt: string | null;
}

export interface Progress {
  version: 1;
  courseId: string;
  sourceFingerprint: string;
  preferences: Preferences;
  currentLessonId: string | null;
  lessons: Record<string, LessonProgress>;
  quizAttempts: Record<string, QuizAttempt[]>;
  exercises: Record<string, { done: boolean; notes: string }>;
  teachBack: Record<string, string>;
  notes: Record<string, string>;
  bookmarks: string[];
  mastery: Record<string, number>;
  review: Record<string, ReviewState>;
  updatedAt: string;
}

export const PROGRESS_VERSION = 1 as const;

export function storageKey(courseId: string): string {
  return `rlb:progress:${courseId}`;
}

export function createProgress(course: Course): Progress {
  const level = course.meta.defaultLevel ?? course.meta.levels[0] ?? 'beginner';
  return {
    version: PROGRESS_VERSION,
    courseId: course.meta.id,
    sourceFingerprint: course.meta.sourceFingerprint ?? '',
    preferences: {
      explanationLevel: level,
      theme: 'system',
      themeName: 'auto',
      teachingStyle: course.meta.style ?? 'balanced',
      reducedChrome: false,
    },
    currentLessonId: null,
    lessons: {},
    quizAttempts: {},
    exercises: {},
    teachBack: {},
    notes: {},
    bookmarks: [],
    mastery: {},
    review: {},
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Keep progress whose ids still exist after a course regeneration; drop the
 * rest. Updates the stored sourceFingerprint.
 */
export function migrateForCourse(prev: Progress, course: Course): Progress {
  const lessonIds = new Set<string>();
  const quizIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const conceptIds = new Set((course.concepts ?? []).map((c) => c.id));
  for (const m of course.modules) {
    for (const l of m.lessons) {
      lessonIds.add(l.id);
      l.quiz?.forEach((q) => quizIds.add(q.id));
      if (l.exercise) exerciseIds.add(l.exercise.id);
    }
  }
  const pick = <T>(obj: Record<string, T>, keep: Set<string>): Record<string, T> =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => keep.has(k)));

  return {
    ...createProgress(course),
    preferences: prev.preferences,
    currentLessonId:
      prev.currentLessonId && lessonIds.has(prev.currentLessonId)
        ? prev.currentLessonId
        : null,
    lessons: pick(prev.lessons, lessonIds),
    quizAttempts: pick(prev.quizAttempts, quizIds),
    exercises: pick(prev.exercises, exerciseIds),
    teachBack: pick(prev.teachBack, lessonIds),
    notes: pick(prev.notes, lessonIds),
    bookmarks: prev.bookmarks.filter((id) => lessonIds.has(id)),
    mastery: pick(prev.mastery, conceptIds),
    review: pick(prev.review, conceptIds),
  };
}

export class ProgressStore {
  private state: Progress;
  private quizToLesson = new Map<string, Lesson>();
  private lessonById = new Map<string, Lesson>();

  constructor(
    private course: Course,
    private backend: StorageBackend = getDefaultBackend(),
  ) {
    for (const m of course.modules) {
      for (const l of m.lessons) {
        this.lessonById.set(l.id, l);
        l.quiz?.forEach((q) => this.quizToLesson.set(q.id, l));
      }
    }
    this.state = this.read();
  }

  private read(): Progress {
    const stored = readJSON<Progress>(this.backend, storageKey(this.course.meta.id));
    if (!stored || stored.version !== PROGRESS_VERSION || stored.courseId !== this.course.meta.id) {
      return createProgress(this.course);
    }
    if (stored.sourceFingerprint !== (this.course.meta.sourceFingerprint ?? '')) {
      return migrateForCourse(stored, this.course);
    }
    return stored;
  }

  private commit(): Progress {
    this.state = { ...this.state, updatedAt: new Date().toISOString() };
    writeJSON(this.backend, storageKey(this.course.meta.id), this.state);
    return this.state;
  }

  getState(): Progress {
    return this.state;
  }

  private masteryInputs(): MasteryInputs {
    return {
      quizAttempts: this.state.quizAttempts,
      exercises: this.state.exercises,
      teachBack: this.state.teachBack,
    };
  }

  recomputeMastery(conceptIds?: string[]): Progress {
    const ids = conceptIds ?? (this.course.concepts ?? []).map((c) => c.id);
    const inputs = this.masteryInputs();
    const mastery = { ...this.state.mastery };
    for (const id of ids) mastery[id] = computeConceptMastery(id, this.course, inputs);
    this.state = { ...this.state, mastery };
    return this.commit();
  }

  openLesson(lessonId: string): Progress {
    const prev = this.state.lessons[lessonId];
    this.state = {
      ...this.state,
      currentLessonId: lessonId,
      lessons: {
        ...this.state.lessons,
        [lessonId]: {
          opened: true,
          completed: prev?.completed ?? false,
          openedAt: prev?.openedAt ?? new Date().toISOString(),
          completedAt: prev?.completedAt ?? null,
        },
      },
    };
    return this.commit();
  }

  completeLesson(lessonId: string, completed = true): Progress {
    const prev = this.state.lessons[lessonId];
    this.state = {
      ...this.state,
      lessons: {
        ...this.state.lessons,
        [lessonId]: {
          opened: true,
          completed,
          openedAt: prev?.openedAt ?? new Date().toISOString(),
          completedAt: completed ? new Date().toISOString() : null,
        },
      },
    };
    return this.commit();
  }

  recordQuiz(quizId: string, selected: number, correct: boolean): Progress {
    const attempts = this.state.quizAttempts[quizId] ?? [];
    this.state = {
      ...this.state,
      quizAttempts: {
        ...this.state.quizAttempts,
        [quizId]: [...attempts, { selected, correct, at: new Date().toISOString() }],
      },
    };
    const lesson = this.quizToLesson.get(quizId);
    const concepts = lesson?.concepts ?? [];
    const review = { ...this.state.review };
    for (const c of concepts) review[c] = scheduleReview(review[c], correct);
    this.state = { ...this.state, review };
    return this.recomputeMastery(concepts.length ? concepts : undefined);
  }

  setExerciseDone(exerciseId: string, done: boolean, conceptHints?: string[]): Progress {
    const prev = this.state.exercises[exerciseId];
    this.state = {
      ...this.state,
      exercises: {
        ...this.state.exercises,
        [exerciseId]: { done, notes: prev?.notes ?? '' },
      },
    };
    return this.recomputeMastery(conceptHints);
  }

  setTeachBack(lessonId: string, text: string): Progress {
    this.state = { ...this.state, teachBack: { ...this.state.teachBack, [lessonId]: text } };
    return this.recomputeMastery(this.lessonById.get(lessonId)?.concepts);
  }

  setNote(lessonId: string, text: string): Progress {
    this.state = { ...this.state, notes: { ...this.state.notes, [lessonId]: text } };
    return this.commit();
  }

  toggleBookmark(lessonId: string): Progress {
    const has = this.state.bookmarks.includes(lessonId);
    this.state = {
      ...this.state,
      bookmarks: has
        ? this.state.bookmarks.filter((id) => id !== lessonId)
        : [...this.state.bookmarks, lessonId],
    };
    return this.commit();
  }

  setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Progress {
    this.state = {
      ...this.state,
      preferences: { ...this.state.preferences, [key]: value },
    };
    return this.commit();
  }

  reset(): Progress {
    this.state = createProgress(this.course);
    return this.commit();
  }

  exportJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importJSON(json: string): Progress {
    const parsed = JSON.parse(json) as Progress;
    if (parsed.version !== PROGRESS_VERSION) throw new Error('Unsupported progress version');
    if (parsed.courseId !== this.course.meta.id) throw new Error('Progress is for a different course');
    this.state = migrateForCourse(parsed, this.course);
    return this.commit();
  }
}
