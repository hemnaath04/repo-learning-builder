// Course schema v2 (compact). Two shapes live here:
//  - Compact*  : what course generation produces (small, id-referenced).
//  - runtime   : what components consume (expanded by expand.ts).
// See references/curriculum-schema.md. Keep in sync with scripts/validate-course.mjs.

import type { Archetype, LessonKind } from './archetypes';
import type { Motif, ThemeName } from './theme';

export type ExplanationLevel = 'eli10' | 'beginner' | 'intermediate' | 'advanced';
export type FacetKey = 'what' | 'why' | 'how' | 'whatif';
export type CalloutKind = 'example' | 'analogy' | 'insight' | 'warning' | 'experiment';
export type Locking = 'recommended' | 'strict';

// ---------------------------------------------------------------------------
// Runtime types (post-expansion)
// ---------------------------------------------------------------------------

export interface SourceRef { id?: string; path: string; lines?: string; note?: string }
export interface Tech { id: string; name: string; purpose?: string; location?: string; alternatives?: string; tradeoffs?: string }
export interface Concept { id: string; name: string; summary?: string; moduleId?: string }
export interface GlossaryEntry { term: string; definition: string; seeAlso?: string[] }
export interface Diagram { id: string; title: string; type: 'mermaid'; code: string; nodes?: Record<string, string> }
export interface RepoNode { name: string; kind: 'dir' | 'file'; path: string; role?: string; importance?: number; children?: RepoNode[] }
export interface Facet { key: FacetKey; label: string; body: string }
export interface Callout { kind: CalloutKind; body: string }
export interface FlowStep { actor: string; action: string; note?: string }
export interface CompareRow { aspect: string; a: string; b: string }
export interface CompareTable { a: string; b: string; rows: CompareRow[] }
export interface WalkthroughStep { path?: string; lines?: string; code: string; note?: string; highlight?: number[] }
export interface QuizItem { id: string; question: string; options: string[]; answerIndex: number; hint?: string; explanation: string }
export interface Exercise { id: string; prompt: string; checklist?: string[] }

export interface Lesson {
  id: string;
  title: string;
  order: number;
  archetype: Archetype;
  kind: LessonKind;
  icon: string;
  typeLabel: string;
  est?: number;
  concepts: string[];
  explanations: Partial<Record<ExplanationLevel, string>>;
  facets?: Facet[];
  diagram?: Diagram;
  flow?: FlowStep[];
  walkthrough?: WalkthroughStep[];
  tech?: Tech[];
  compare?: CompareTable;
  callouts?: Callout[];
  sources?: SourceRef[];
  quiz?: QuizItem[];
  exercise?: Exercise;
  teachBack?: string;
  recap?: string[];
  deeper?: string;
  moduleId?: string;
}

export interface Module {
  id: string;
  title: string;
  summary?: string;
  order: number;
  icon?: string;
  milestone?: string;
  lessons: Lesson[];
}

export interface ThemeConfig { name: ThemeName; accent?: string; motif?: Motif; icon?: string }
export interface CourseSettings { locking: Locking }

export interface CourseMeta {
  id: string;
  title: string;
  subtitle?: string;
  sourceType: 'repository' | 'github-url' | 'topic' | 'session' | 'documents' | 'lesson';
  sourceRef?: string;
  sourceFingerprint?: string;
  generatedAt: string;
  category?: string;
  audience?: string;
  goal?: string;
  depth?: 'quick' | 'standard' | 'deep';
  style?: string;
  estimatedMinutes?: number;
  promise?: string;
  outcomes?: string[];
  defaultLevel: ExplanationLevel;
  levels: ExplanationLevel[];
}

export interface Course {
  schemaVersion: 2;
  meta: CourseMeta;
  theme: ThemeConfig;
  settings: CourseSettings;
  concepts: Concept[];
  glossary: GlossaryEntry[];
  tech: Tech[];
  diagrams: Diagram[];
  repoMap?: RepoNode | null;
  modules: Module[];
}

// ---------------------------------------------------------------------------
// Compact types (pre-expansion, authored by generation)
// ---------------------------------------------------------------------------

export interface Registries {
  concepts?: Record<string, { name: string; summary?: string; moduleId?: string }>;
  sources?: Record<string, { path: string; lines?: string; note?: string }>;
  tech?: Record<string, Omit<Tech, 'id'>>;
  glossary?: Record<string, GlossaryEntry>;
  diagrams?: Record<string, { title: string; type?: 'mermaid'; code: string; nodes?: Record<string, string> }>;
}

export interface CompactQuiz { id: string; q: string; options: string[]; answer: number; hint?: string; why: string }

export interface CompactLesson {
  id: string;
  title: string;
  order?: number;
  archetype: Archetype;
  est?: number;
  concepts?: string[];
  levels?: Partial<Record<ExplanationLevel, string>>;
  facets?: Partial<Record<FacetKey, string>>;
  example?: string;
  analogy?: string;
  insight?: string;
  warning?: string;
  experiment?: string;
  sources?: string[];
  diagram?: string;
  flow?: FlowStep[];
  walkthrough?: { src?: string; code: string; note?: string; highlight?: number[] }[];
  tech?: string[];
  compare?: CompareTable;
  quiz?: CompactQuiz[];
  exercise?: Exercise;
  teachBack?: string;
  recap?: string[];
  deeper?: string;
}

export interface CompactModule {
  id: string;
  title: string;
  summary?: string;
  order?: number;
  icon?: string;
  milestone?: string;
  lessons: CompactLesson[];
}

export interface CompactCourse {
  schemaVersion: 2;
  meta: Omit<CourseMeta, 'defaultLevel'> & { defaultLevel?: ExplanationLevel };
  theme?: Partial<ThemeConfig>;
  settings?: Partial<CourseSettings>;
  registries?: Registries;
  repoMap?: RepoNode | null;
  modules: CompactModule[];
}

// ---------------------------------------------------------------------------
// Validation (compact v2)
// ---------------------------------------------------------------------------

export interface ValidationResult { ok: boolean; errors: string[]; warnings: string[] }

const ARCHETYPE_SET = new Set<Archetype>([
  'concept', 'story', 'architecture', 'code-walkthrough', 'request-flow',
  'technology', 'exercise', 'debugging', 'comparison', 'final-project', 'teach-back',
]);

export function validateCourse(course: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, string>();

  const requireId = (id: unknown, kind: string, where: string): void => {
    if (id == null || id === '') { errors.push(`${where}: missing id`); return; }
    const key = String(id);
    if (seen.has(key)) errors.push(`duplicate id "${key}" (${kind} and ${seen.get(key)})`);
    else seen.set(key, kind);
  };

  if (!course || typeof course !== 'object') return { ok: false, errors: ['course is not an object'], warnings };
  const c = course as Record<string, any>;

  if (c.schemaVersion !== 2) errors.push('schemaVersion must be 2');

  const meta = c.meta;
  if (!meta || typeof meta !== 'object') {
    errors.push('meta is required');
  } else {
    for (const k of ['id', 'title', 'sourceType', 'generatedAt']) if (!meta[k]) errors.push(`meta.${k} is required`);
    if (!Array.isArray(meta.levels) || meta.levels.length === 0) errors.push('meta.levels must be a non-empty array');
    else if (meta.defaultLevel && !meta.levels.includes(meta.defaultLevel)) errors.push(`meta.defaultLevel "${meta.defaultLevel}" not in levels`);
  }
  const defaultLevel = meta?.defaultLevel || meta?.levels?.[0];

  const reg = c.registries ?? {};
  const sourceIds = new Set(Object.keys(reg.sources ?? {}));
  const techIds = new Set(Object.keys(reg.tech ?? {}));
  const conceptIds = new Set(Object.keys(reg.concepts ?? {}));
  const diagramIds = new Set(Object.keys(reg.diagrams ?? {}));
  for (const id of [...sourceIds, ...techIds, ...conceptIds, ...diagramIds]) requireId(id, 'registry', `registries.${id}`);

  if (!Array.isArray(c.modules) || c.modules.length === 0) {
    errors.push('modules must be a non-empty array');
  } else {
    c.modules.forEach((mod: any, mi: number) => {
      const mw = `modules[${mi}]`;
      requireId(mod?.id, 'module', mw);
      if (!mod?.title) errors.push(`${mw}: missing title`);
      if (!Array.isArray(mod?.lessons) || mod.lessons.length === 0) { errors.push(`${mw}: lessons must be a non-empty array`); return; }
      mod.lessons.forEach((lesson: any, li: number) => {
        const lw = `${mw}.lessons[${li}]`;
        requireId(lesson?.id, 'lesson', lw);
        if (!lesson?.title) errors.push(`${lw}: missing title`);
        if (!lesson?.archetype || !ARCHETYPE_SET.has(lesson.archetype)) errors.push(`${lw}: invalid or missing archetype "${lesson?.archetype}"`);
        const hasText = lesson?.levels && Object.keys(lesson.levels).length > 0;
        const hasFacets = lesson?.facets && Object.keys(lesson.facets).length > 0;
        if (!hasText && !hasFacets && !lesson?.walkthrough && !lesson?.flow && !lesson?.compare) {
          warnings.push(`${lw}: has no explanation text, facets, walkthrough, flow, or comparison`);
        }
        if (hasText && defaultLevel && !lesson.levels[defaultLevel]) {
          warnings.push(`${lw}: levels present but missing default level "${defaultLevel}"`);
        }
        for (const sid of lesson?.sources ?? []) if (!sourceIds.has(sid)) warnings.push(`${lw}: source "${sid}" not in registries.sources`);
        for (const tid of lesson?.tech ?? []) if (!techIds.has(tid)) warnings.push(`${lw}: tech "${tid}" not in registries.tech`);
        for (const cid of lesson?.concepts ?? []) if (!conceptIds.has(cid)) warnings.push(`${lw}: concept "${cid}" not in registries.concepts`);
        if (lesson?.diagram && !diagramIds.has(lesson.diagram)) warnings.push(`${lw}: diagram "${lesson.diagram}" not in registries.diagrams`);
        if (lesson?.quiz != null) {
          if (!Array.isArray(lesson.quiz)) errors.push(`${lw}.quiz must be an array`);
          else lesson.quiz.forEach((q: any, qi: number) => {
            const qw = `${lw}.quiz[${qi}]`;
            requireId(q?.id, 'quiz', qw);
            if (!q?.q) errors.push(`${qw}: missing question text (q)`);
            if (!Array.isArray(q?.options) || q.options.length < 2) errors.push(`${qw}: options must have at least 2 entries`);
            else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) errors.push(`${qw}: answer out of range`);
            if (!q?.why) warnings.push(`${qw}: missing explanation (why)`);
          });
        }
      });
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Flatten runtime lessons in display order, annotated with their module id. */
export function orderedLessons(course: Course): Array<Lesson & { moduleId: string }> {
  return course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
}
