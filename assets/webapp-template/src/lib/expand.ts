// Expand a compact v3 course into the runtime model the Atlas renderer consumes.
// Registry ids are resolved into inline objects; fixed labels come from archetypes.

import {
  validateCourse,
  type CompactCourse, type CompactLesson, type Course, type Concept, type Diagram,
  type Facet, type Callout, type Lesson, type QuizItem, type SourceRef, type Tech,
  type CalloutKind, type SectionKey,
} from './schema';
import { archetypeSpec, SECTION_LABELS, SECTION_ORDER } from './archetypes';

const CALLOUT_KEYS: CalloutKind[] = ['example', 'analogy', 'insight', 'warning'];

function expandLesson(
  raw: CompactLesson,
  sourcesById: Map<string, SourceRef>,
  techById: Map<string, Tech>,
  diagramsById: Map<string, Diagram>,
  checksById: Map<string, { q: string; options: string[]; answer: number; hint?: string; why: string }>,
): Lesson {
  const spec = archetypeSpec(raw.type);

  const facets: Facet[] | undefined = raw.sections
    ? (SECTION_ORDER as readonly SectionKey[])
        .filter((k) => raw.sections![k])
        .map((k) => ({ key: k, label: SECTION_LABELS[k], body: raw.sections![k]! }))
    : undefined;

  const callouts: Callout[] = CALLOUT_KEYS.filter((k) => raw[k]).map((k) => ({ kind: k, body: raw[k] as string }));

  const sources = (raw.sourceIds ?? []).map((id) => sourcesById.get(id)).filter((s): s is SourceRef => Boolean(s));
  const tech = (raw.techIds ?? []).map((id) => techById.get(id)).filter((t): t is Tech => Boolean(t));

  const walkthrough = raw.walkthrough?.map((step) => {
    const src = step.src ? sourcesById.get(step.src) : undefined;
    return { path: src?.path, lines: src?.lines, code: step.code, note: step.note, highlight: step.highlight };
  });

  const quiz: QuizItem[] | undefined = raw.checks
    ? raw.checks.flatMap((id) => {
        const ch = checksById.get(id);
        return ch
          ? [{ id, question: ch.q, options: ch.options, answerIndex: ch.answer, hint: ch.hint, explanation: ch.why } as QuizItem]
          : [];
      })
    : undefined;

  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    type: raw.type,
    typeLabel: spec.label,
    icon: spec.icon,
    est: raw.est,
    difficulty: raw.difficulty,
    concepts: raw.conceptIds ?? [],
    facets,
    callouts: callouts.length ? callouts : undefined,
    diagram: raw.diagram ? diagramsById.get(raw.diagram) : undefined,
    flow: raw.flow,
    walkthrough,
    compare: raw.compare,
    tech: tech.length ? tech : undefined,
    sources: sources.length ? sources : undefined,
    quiz: quiz && quiz.length ? quiz : undefined,
    activity: raw.activity,
    teachBack: raw.teachBack,
    deeper: raw.deeper,
  };
}

export function expandCourse(compact: CompactCourse): Course {
  const reg = compact.registries ?? {};
  const concepts: Concept[] = Object.entries(reg.concepts ?? {}).map(([id, v]) => ({ id, ...v }));
  const technologies: Tech[] = Object.entries(reg.technologies ?? {}).map(([id, v]) => ({ id, ...v }));
  const diagrams: Diagram[] = Object.entries(compact.diagrams ?? {}).map(([id, v]) => ({ id, title: v.title, code: v.code }));
  const glossary = Object.values(reg.glossary ?? {});

  const sourcesById = new Map(Object.entries(reg.sources ?? {}).map(([id, v]) => [id, { id, ...v } as SourceRef]));
  const techById = new Map(technologies.map((t) => [t.id, t]));
  const diagramsById = new Map(diagrams.map((d) => [d.id, d]));
  const checksById = new Map(Object.entries(compact.checks ?? {}));

  const modules = compact.modules.map((m) => ({
    id: m.id,
    title: m.title,
    summary: m.summary,
    icon: m.icon ?? (m.landmarkId ? reg.landmarks?.[m.landmarkId]?.icon : undefined),
    lessons: m.lessons.map((l) => expandLesson(l, sourcesById, techById, diagramsById, checksById)),
  }));

  const levels = compact.meta.levels ?? ['eli10', 'beginner', 'intermediate', 'advanced'];
  const defaultLevel = compact.meta.defaultLevel ?? levels[0];

  return {
    schemaVersion: 3,
    meta: { ...compact.meta, levels, defaultLevel },
    concepts,
    technologies,
    glossary,
    diagrams,
    repoMap: compact.repoMap ?? null,
    modules,
  };
}

export function loadCourse(raw: unknown): Course {
  const result = validateCourse(raw);
  if (!result.ok) throw new Error(`Invalid course data:\n${result.errors.join('\n')}`);
  return expandCourse(raw as CompactCourse);
}
