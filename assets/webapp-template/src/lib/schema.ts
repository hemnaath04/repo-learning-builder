// Course schema v3 (compact, registry-based). Two shapes:
//  - Compact* : what generation produces (small, id-referenced, no repeated labels).
//  - runtime  : what components consume (expanded by expand.ts).
// The renderer supplies every fixed label (the five questions, Example, Analogy,
// Knowledge check, Try it yourself, Go deeper). Generated data carries only values.

import type { Archetype } from './archetypes';

export type ExplanationLevel = 'eli10' | 'beginner' | 'intermediate' | 'advanced';
export type SectionKey = 'what' | 'why' | 'how' | 'connects' | 'ifChanged';
export type CalloutKind = 'example' | 'analogy' | 'insight' | 'warning' | 'misconception';

// ---------------------------------------------------------------------------
// Runtime types (post-expansion)
// ---------------------------------------------------------------------------
export interface SourceRef { id?: string; path: string; lines?: string; note?: string }
export interface Tech { id: string; name: string; purpose?: string; location?: string; alternatives?: string; tradeoffs?: string }
export interface Concept { id: string; name: string; summary?: string }
export interface GlossaryEntry { term: string; definition: string; seeAlso?: string[] }
export interface Diagram { id: string; title: string; code: string }
export interface RepoNode {
  name: string; kind: 'dir' | 'file'; path: string; role?: string; importance?: number; children?: RepoNode[];
  // Optional richer file details (all omitted for topic courses).
  purpose?: string;
  symbols?: string[];
  io?: string;
  imports?: string[];
  callers?: string[];
  related?: string[];
  concerns?: string;
  lessonIds?: string[];
}
export interface Facet { key: SectionKey; label: string; body: string }
export interface AnalogyPair { from: string; to: string }
export interface Callout { kind: CalloutKind; body: string; pairs?: AnalogyPair[] }
export interface FlowStep { actor: string; action: string; note?: string }

// --- Pedagogy blocks (all optional, additive to schema v3) ---------------
// A prediction the learner commits to before the mechanism is shown.
export interface Predict { question: string; options?: string[]; reveal: string }
// One real input traced through the system, with the live state at each step.
export interface WorkedStep { label: string; detail?: string; state?: Array<{ k: string; v: string }> }
export interface Worked { title?: string; intro: string; steps: WorkedStep[]; outcome?: string }
// A what-if explorer: the learner picks an input and watches what happens.
export interface ScenarioChoice { label: string; steps: string[]; outcome: string }
export interface Scenario { title?: string; prompt: string; choices: ScenarioChoice[] }
// A static image shipped next to course.json (or an absolute URL).
export interface Figure { src: string; alt: string; caption?: string }
export interface CompareRow { aspect: string; a: string; b: string }
export interface CompareTable { a: string; b: string; rows: CompareRow[] }
export interface WalkthroughStep {
  path?: string; lines?: string; code: string; note?: string; highlight?: number[];
  inputs?: string[]; outputs?: string[]; deps?: string[]; failure?: string[];
}
export interface QuizItem { id: string; question: string; options: string[]; answerIndex: number; hint?: string; explanation: string }

export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  type: Archetype;
  typeLabel: string;
  icon: string;
  est?: number;
  difficulty?: number; // 1-3
  concepts: string[];
  facets?: Facet[];
  callouts?: Callout[];
  diagram?: Diagram;
  flow?: FlowStep[];
  walkthrough?: WalkthroughStep[];
  compare?: CompareTable;
  tech?: Tech[];
  sources?: SourceRef[];
  quiz?: QuizItem[];
  activity?: string;
  teachBack?: string;
  deeper?: string;
  predict?: Predict;
  worked?: Worked;
  scenario?: Scenario;
  figure?: Figure;
  moduleId?: string;
}

export interface Module {
  id: string;
  title: string;
  summary?: string;
  icon?: string;
  lessons: Lesson[];
}

export interface CourseMeta {
  id: string;
  title: string;
  subtitle?: string;
  sourceType: 'repository' | 'github-url' | 'topic' | 'lesson' | 'documents' | 'session';
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
  levels: ExplanationLevel[];
  defaultLevel: ExplanationLevel;
}

export interface Course {
  schemaVersion: 3;
  meta: CourseMeta;
  concepts: Concept[];
  technologies: Tech[];
  glossary: GlossaryEntry[];
  diagrams: Diagram[];
  repoMap?: RepoNode | null;
  modules: Module[];
}

// Registry entry in the course registry (public/courses/index.json).
export interface CourseSummary {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  estimatedMinutes?: number;
  modules?: number;
  lessons?: number;
  updatedAt?: string;
}
export interface CourseRegistry { courses: CourseSummary[] }

// ---------------------------------------------------------------------------
// Compact types (pre-expansion)
// ---------------------------------------------------------------------------
export interface Registries {
  concepts?: Record<string, { name: string; summary?: string }>;
  technologies?: Record<string, Omit<Tech, 'id'>>;
  sources?: Record<string, { path: string; lines?: string; note?: string }>;
  glossary?: Record<string, GlossaryEntry>;
  landmarks?: Record<string, { title: string; icon?: string }>;
}
export interface CompactCheck { q: string; options: string[]; answer: number; hint?: string; why: string }

export interface CompactLesson {
  id: string;
  type: Archetype;
  title: string;
  summary?: string;
  est?: number;
  difficulty?: number;
  conceptIds?: string[];
  sourceIds?: string[];
  techIds?: string[];
  sections?: Partial<Record<SectionKey, string>>;
  example?: string;
  analogy?: string;
  analogyPairs?: AnalogyPair[]; // "in the story" -> "in this system" mapping under the analogy
  insight?: string;
  warning?: string;
  misconception?: string;
  checks?: string[]; // ids into top-level checks registry
  activity?: string;
  diagram?: string;
  predict?: Predict;
  worked?: Worked;
  scenario?: Scenario;
  figure?: Figure;
  walkthrough?: { src?: string; code: string; note?: string; highlight?: number[]; inputs?: string[]; outputs?: string[]; deps?: string[]; failure?: string[] }[];
  flow?: FlowStep[];
  compare?: CompareTable;
  teachBack?: string;
  deeper?: string;
}

export interface CompactModule {
  id: string;
  title: string;
  summary?: string;
  icon?: string;
  landmarkId?: string;
  lessons: CompactLesson[];
}

export interface CompactCourse {
  schemaVersion: 3;
  meta: Omit<CourseMeta, 'defaultLevel' | 'levels'> & { defaultLevel?: ExplanationLevel; levels?: ExplanationLevel[] };
  registries?: Registries;
  checks?: Record<string, CompactCheck>;
  diagrams?: Record<string, { title: string; code: string }>;
  repoMap?: RepoNode | null;
  modules: CompactModule[];
}

// ---------------------------------------------------------------------------
// Validation (compact v3). Used by scripts/validate-lesson.mjs mirror + tests.
// ---------------------------------------------------------------------------
export interface ValidationResult { ok: boolean; errors: string[]; warnings: string[] }

export const ARCHETYPES = [
  'overview', 'story', 'concept', 'technology', 'architecture', 'request-flow',
  'code-walkthrough', 'comparison', 'debugging', 'exercise', 'customization',
  'final-project', 'teach-back',
] as const;
const ARCHETYPE_SET = new Set<string>(ARCHETYPES as readonly string[]);

export function validateCourse(course: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, string>();
  const requireId = (id: unknown, kind: string, where: string) => {
    if (id == null || id === '') { errors.push(`${where}: missing id`); return; }
    const k = String(id);
    if (seen.has(k)) errors.push(`duplicate id "${k}" (${kind} and ${seen.get(k)})`);
    else seen.set(k, kind);
  };

  if (!course || typeof course !== 'object') return { ok: false, errors: ['course is not an object'], warnings };
  const c = course as Record<string, any>;
  if (c.schemaVersion !== 3) errors.push('schemaVersion must be 3');

  const meta = c.meta;
  if (!meta || typeof meta !== 'object') errors.push('meta is required');
  else for (const k of ['id', 'title', 'sourceType', 'generatedAt']) if (!meta[k]) errors.push(`meta.${k} is required`);

  const reg = c.registries ?? {};
  const conceptIds = new Set(Object.keys(reg.concepts ?? {}));
  const sourceIds = new Set(Object.keys(reg.sources ?? {}));
  const techIds = new Set(Object.keys(reg.technologies ?? {}));
  const checkIds = new Set(Object.keys(c.checks ?? {}));
  const diagramIds = new Set(Object.keys(c.diagrams ?? {}));

  if (!Array.isArray(c.modules) || c.modules.length === 0) {
    errors.push('modules must be a non-empty array');
  } else {
    c.modules.forEach((m: any, mi: number) => {
      const mw = `modules[${mi}]`;
      requireId(m?.id, 'module', mw);
      if (!m?.title) errors.push(`${mw}: missing title`);
      if (!Array.isArray(m?.lessons) || m.lessons.length === 0) { errors.push(`${mw}: lessons must be non-empty`); return; }
      m.lessons.forEach((l: any, li: number) => {
        const lw = `${mw}.lessons[${li}]`;
        requireId(l?.id, 'lesson', lw);
        if (!l?.title) errors.push(`${lw}: missing title`);
        if (!l?.type || !ARCHETYPE_SET.has(l.type)) errors.push(`${lw}: invalid archetype "${l?.type}"`);
        const hasBody = (l?.sections && Object.keys(l.sections).length) || l?.summary || l?.walkthrough || l?.flow || l?.compare;
        if (!hasBody) warnings.push(`${lw}: no sections, summary, walkthrough, flow, or comparison`);
        for (const id of l?.conceptIds ?? []) if (!conceptIds.has(id)) warnings.push(`${lw}: concept "${id}" not in registries.concepts`);
        for (const id of l?.sourceIds ?? []) if (!sourceIds.has(id)) warnings.push(`${lw}: source "${id}" not in registries.sources`);
        for (const id of l?.techIds ?? []) if (!techIds.has(id)) warnings.push(`${lw}: tech "${id}" not in registries.technologies`);
        for (const id of l?.checks ?? []) if (!checkIds.has(id)) warnings.push(`${lw}: check "${id}" not in checks`);
        if (l?.diagram && !diagramIds.has(l.diagram)) warnings.push(`${lw}: diagram "${l.diagram}" not in diagrams`);
        if (l?.predict) {
          if (!l.predict.question || !l.predict.reveal) errors.push(`${lw}: predict needs question and reveal`);
          if (l.predict.options && (!Array.isArray(l.predict.options) || l.predict.options.length < 2)) errors.push(`${lw}: predict.options must have >= 2 entries`);
        }
        if (l?.worked) {
          if (!l.worked.intro) errors.push(`${lw}: worked needs an intro`);
          if (!Array.isArray(l.worked.steps) || l.worked.steps.length === 0) errors.push(`${lw}: worked.steps must be non-empty`);
          else l.worked.steps.forEach((st: any, si: number) => {
            if (!st?.label) errors.push(`${lw}: worked.steps[${si}] missing label`);
            if (st?.state && (!Array.isArray(st.state) || st.state.some((p: any) => !p?.k || typeof p.v !== 'string'))) errors.push(`${lw}: worked.steps[${si}].state must be [{k,v}] strings`);
          });
        }
        if (l?.scenario) {
          if (!l.scenario.prompt) errors.push(`${lw}: scenario needs a prompt`);
          if (!Array.isArray(l.scenario.choices) || l.scenario.choices.length === 0) errors.push(`${lw}: scenario.choices must be non-empty`);
          else l.scenario.choices.forEach((ch: any, ci: number) => {
            if (!ch?.label || !ch?.outcome) errors.push(`${lw}: scenario.choices[${ci}] needs label and outcome`);
            if (ch?.steps && !Array.isArray(ch.steps)) errors.push(`${lw}: scenario.choices[${ci}].steps must be an array`);
          });
        }
        if (l?.figure && (!l.figure.src || !l.figure.alt)) errors.push(`${lw}: figure needs src and alt`);
        if (l?.analogyPairs) {
          if (!Array.isArray(l.analogyPairs) || l.analogyPairs.some((p: any) => !p?.from || !p?.to)) errors.push(`${lw}: analogyPairs must be [{from,to}]`);
          if (!l.analogy) warnings.push(`${lw}: analogyPairs without an analogy`);
        }
        // Pedagogy nudges (advisory): every lesson should show, not just tell.
        if (!l?.example && !l?.worked && !l?.scenario && !l?.walkthrough) warnings.push(`${lw}: no concrete example (example, worked, scenario, or walkthrough)`);
        if (!l?.activity && !['story', 'teach-back', 'overview'].includes(l?.type)) warnings.push(`${lw}: no activity`);
      });
    });
  }

  for (const [id, ch] of Object.entries<any>(c.checks ?? {})) {
    const w = `checks.${id}`;
    if (!ch?.q) errors.push(`${w}: missing question (q)`);
    if (!Array.isArray(ch?.options) || ch.options.length < 2) errors.push(`${w}: options must have >= 2 entries`);
    else if (typeof ch.answer !== 'number' || ch.answer < 0 || ch.answer >= ch.options.length) errors.push(`${w}: answer out of range`);
    if (!ch?.why) warnings.push(`${w}: missing explanation (why)`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function orderedLessons(course: Course): Array<Lesson & { moduleId: string }> {
  return course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
}
