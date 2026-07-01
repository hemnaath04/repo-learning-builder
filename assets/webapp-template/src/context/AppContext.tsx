import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { Course, CourseRegistry, ExplanationLevel } from '../lib/schema';
import { fetchCourse, fetchRegistry } from '../lib/courses';
import { ProgressStore, type Preferences, type Progress, type ThemePref } from '../lib/progress';

export type View =
  | 'atlas' | 'lesson' | 'explorer' | 'dashboard' | 'glossary' | 'search'
  | 'notes' | 'settings' | 'certificate';
export interface Route { view: View; lessonId?: string; q?: string }

export type Status = 'loading' | 'ready' | 'empty' | 'error';

interface AppContextValue {
  status: Status;
  error?: string;
  registry: CourseRegistry | null;
  courseId: string | null;
  course: Course | null;
  progress: Progress | null;
  route: Route;
  navigate: (route: Route) => void;
  selectCourse: (id: string) => void;
  level: ExplanationLevel;
  theme: ThemePref;
  effectiveTheme: 'light' | 'dark';
  setTheme: (t: ThemePref) => void;
  actions: {
    completeLesson: (lessonId: string, completed?: boolean) => void;
    recordQuiz: (quizId: string, selected: number, correct: boolean) => void;
    setExerciseDone: (lessonId: string, done: boolean, conceptHints?: string[]) => void;
    setTeachBack: (lessonId: string, text: string) => void;
    setNote: (lessonId: string, text: string) => void;
    toggleBookmark: (lessonId: string) => void;
    setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
    reset: () => void;
    importJSON: (json: string) => void;
    exportJSON: () => string;
  };
}

const Ctx = createContext<AppContextValue | null>(null);

function systemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function parseHash(): { courseId?: string; route: Route } {
  if (typeof window === 'undefined') return { route: { view: 'atlas' } };
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [courseId, view, param] = parts;
  const v = (view as View) || 'atlas';
  if (v === 'lesson') return { courseId, route: { view: 'lesson', lessonId: param } };
  if (v === 'search') return { courseId, route: { view: 'search', q: param ? decodeURIComponent(param) : '' } };
  return { courseId, route: { view: v } };
}

function hashFor(courseId: string, route: Route): string {
  if (route.view === 'lesson') return `#/${courseId}/lesson/${route.lessonId ?? ''}`;
  if (route.view === 'search') return `#/${courseId}/search/${encodeURIComponent(route.q ?? '')}`;
  return `#/${courseId}/${route.view}`;
}

export function AppProvider({
  children, initialCourse, initialRegistry,
}: {
  children: ReactNode;
  initialCourse?: Course;
  initialRegistry?: CourseRegistry;
}) {
  const injected = Boolean(initialCourse);
  const [registry, setRegistry] = useState<CourseRegistry | null>(initialRegistry ?? null);
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [courseId, setCourseId] = useState<string | null>(initialCourse?.meta.id ?? null);
  const [status, setStatus] = useState<Status>(initialCourse ? 'ready' : 'loading');
  const [error, setError] = useState<string | undefined>();
  const [route, setRoute] = useState<Route>(() => parseHash().route);
  const [sysTheme, setSysTheme] = useState<'light' | 'dark'>(() => systemTheme());
  const [progress, setProgress] = useState<Progress | null>(null);
  const storeRef = useRef<ProgressStore | null>(null);

  // Build a progress store whenever the active course changes.
  useEffect(() => {
    if (!course) return;
    storeRef.current = new ProgressStore(course);
    setProgress(storeRef.current.getState());
  }, [course]);

  // Initial load (skipped when a course is injected, e.g. in tests).
  useEffect(() => {
    if (injected) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = initialRegistry ?? (await fetchRegistry());
        if (cancelled) return;
        setRegistry(reg);
        if (reg.courses.length === 0) { setStatus('empty'); return; }
        const wanted = parseHash().courseId;
        const pick = reg.courses.find((c) => c.id === wanted) ?? reg.courses[0];
        const loaded = await fetchCourse(pick.id);
        if (cancelled) return;
        setCourse(loaded);
        setCourseId(pick.id);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setStatus('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [injected, initialRegistry]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const theme = progress?.preferences.theme ?? 'system';
  const effectiveTheme = theme === 'system' ? sysTheme : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.themeName = 'atlas';
  }, [effectiveTheme]);

  // Keep hash in sync with route + course.
  useEffect(() => {
    const onHash = () => {
      const p = parseHash();
      setRoute(p.route);
      if (p.courseId && p.courseId !== courseId) selectCourse(p.courseId);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    if (next.view === 'lesson' && next.lessonId && storeRef.current) {
      setProgress(storeRef.current.openLesson(next.lessonId));
    }
    if (courseId && typeof window !== 'undefined') {
      const h = hashFor(courseId, next);
      if (window.location.hash !== h) window.location.hash = h;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [courseId]);

  const selectCourse = useCallback(async (id: string) => {
    if (id === courseId) return;
    setStatus('loading');
    try {
      const loaded = await fetchCourse(id);
      setCourse(loaded);
      setCourseId(id);
      setRoute({ view: 'atlas' });
      setStatus('ready');
    } catch (e) {
      setError((e as Error).message); setStatus('error');
    }
  }, [courseId]);

  const actions = useMemo<AppContextValue['actions']>(() => {
    const s = () => storeRef.current!;
    return {
      completeLesson: (id, c) => setProgress(s().completeLesson(id, c)),
      recordQuiz: (qid, sel, ok) => setProgress(s().recordQuiz(qid, sel, ok)),
      setExerciseDone: (id, done, hints) => setProgress(s().setExerciseDone(id, done, hints)),
      setTeachBack: (id, t) => setProgress(s().setTeachBack(id, t)),
      setNote: (id, t) => setProgress(s().setNote(id, t)),
      toggleBookmark: (id) => setProgress(s().toggleBookmark(id)),
      setPreference: (k, v) => setProgress(s().setPreference(k, v)),
      reset: () => setProgress(s().reset()),
      importJSON: (json) => setProgress(s().importJSON(json)),
      exportJSON: () => s().exportJSON(),
    };
  }, []);

  const value: AppContextValue = {
    status, error, registry, courseId, course, progress, route, navigate, selectCourse,
    level: progress?.preferences.explanationLevel ?? 'beginner',
    theme, effectiveTheme, setTheme: (t) => actions.setPreference('theme', t),
    actions,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
