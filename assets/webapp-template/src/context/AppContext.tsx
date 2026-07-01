import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Course, ExplanationLevel } from '../lib/schema';
import { loadCourse } from '../lib/expand';
import { ProgressStore, type Preferences, type Progress, type ThemePref } from '../lib/progress';
import { THEME_NAMES, type ThemeName } from '../lib/theme';
import rawCourse from '../data';

export type Route =
  | { name: 'home' }
  | { name: 'overview' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'glossary' }
  | { name: 'explorer' }
  | { name: 'dashboard' }
  | { name: 'search'; q: string }
  | { name: 'certificate' };

interface AppContextValue {
  course: Course;
  progress: Progress;
  route: Route;
  navigate: (route: Route) => void;
  level: ExplanationLevel;
  setLevel: (level: ExplanationLevel) => void;
  theme: ThemePref;
  setTheme: (theme: ThemePref) => void;
  effectiveTheme: 'light' | 'dark';
  themeName: ThemeName;
  setThemeName: (name: ThemeName | 'auto') => void;
  actions: {
    completeLesson: (lessonId: string, completed?: boolean) => void;
    recordQuiz: (quizId: string, selected: number, correct: boolean) => void;
    setExerciseDone: (exerciseId: string, done: boolean, conceptHints?: string[]) => void;
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

// Lightweight hash routing so screens are deep-linkable and shareable.
function parseHash(): Route {
  if (typeof window === 'undefined') return { name: 'home' };
  const h = window.location.hash.replace(/^#\/?/, '');
  const [head, ...rest] = h.split('/');
  const tail = rest.join('/');
  switch (head) {
    case 'overview': return { name: 'overview' };
    case 'dashboard': return { name: 'dashboard' };
    case 'explorer': return { name: 'explorer' };
    case 'glossary': return { name: 'glossary' };
    case 'certificate': return { name: 'certificate' };
    case 'lesson': return tail ? { name: 'lesson', lessonId: tail } : { name: 'home' };
    case 'search': return tail ? { name: 'search', q: decodeURIComponent(tail) } : { name: 'home' };
    default: return { name: 'home' };
  }
}

function hashFor(route: Route): string {
  switch (route.name) {
    case 'home': return '#/';
    case 'lesson': return `#/lesson/${route.lessonId}`;
    case 'search': return `#/search/${encodeURIComponent(route.q)}`;
    default: return `#/${route.name}`;
  }
}

function systemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const course = useMemo(() => loadCourse(rawCourse), []);
  const store = useMemo(() => new ProgressStore(course), [course]);
  const [progress, setProgress] = useState<Progress>(() => store.getState());
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [sysTheme, setSysTheme] = useState<'light' | 'dark'>(() => systemTheme());

  // Keep the route in sync with the URL hash (back/forward + shareable links).
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const theme = progress.preferences.theme;
  const effectiveTheme = theme === 'system' ? sysTheme : theme;
  const pref = progress.preferences.themeName;
  const themeName: ThemeName =
    pref && pref !== 'auto' && (THEME_NAMES as string[]).includes(pref)
      ? (pref as ThemeName)
      : course.theme.name;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSysTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Apply the resolved mode + palette + optional accent override to the document.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme;
    root.dataset.themeName = themeName;
    if (course.theme.accent) {
      root.style.setProperty('--primary', course.theme.accent);
    } else {
      root.style.removeProperty('--primary');
    }
  }, [effectiveTheme, themeName, course.theme.accent]);

  const navigate = useCallback(
    (next: Route) => {
      if (next.name === 'lesson') setProgress(store.openLesson(next.lessonId));
      setRoute(next);
      if (typeof window !== 'undefined') {
        if (window.location.hash !== hashFor(next)) window.location.hash = hashFor(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [store],
  );

  const actions = useMemo<AppContextValue['actions']>(
    () => ({
      completeLesson: (id, completed) => setProgress(store.completeLesson(id, completed)),
      recordQuiz: (qid, sel, correct) => setProgress(store.recordQuiz(qid, sel, correct)),
      setExerciseDone: (id, done, hints) => setProgress(store.setExerciseDone(id, done, hints)),
      setTeachBack: (id, text) => setProgress(store.setTeachBack(id, text)),
      setNote: (id, text) => setProgress(store.setNote(id, text)),
      toggleBookmark: (id) => setProgress(store.toggleBookmark(id)),
      setPreference: (key, value) => setProgress(store.setPreference(key, value)),
      reset: () => setProgress(store.reset()),
      importJSON: (json) => setProgress(store.importJSON(json)),
      exportJSON: () => store.exportJSON(),
    }),
    [store],
  );

  const value: AppContextValue = {
    course,
    progress,
    route,
    navigate,
    level: progress.preferences.explanationLevel,
    setLevel: (l) => actions.setPreference('explanationLevel', l),
    theme,
    setTheme: (t) => actions.setPreference('theme', t),
    effectiveTheme,
    themeName,
    setThemeName: (n) => actions.setPreference('themeName', n),
    actions,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
