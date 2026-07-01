// Expand a compact v2 course into the runtime model the components consume.
// This is where the renderer supplies every repeated label, facet name, lesson
// kind, icon, and default recap, so generated data stays small.

import {
  validateCourse,
  type CompactCourse,
  type CompactLesson,
  type Course,
  type Concept,
  type Diagram,
  type Facet,
  type Callout,
  type Lesson,
  type QuizItem,
  type SourceRef,
  type Tech,
  type CalloutKind,
  type FacetKey,
} from './schema';
import { archetypeSpec } from './archetypes';
import { selectTheme } from './theme';

const FACET_ORDER: FacetKey[] = ['what', 'why', 'how', 'whatif'];
const CALLOUT_KEYS: CalloutKind[] = ['example', 'analogy', 'insight', 'warning', 'experiment'];

function expandLesson(
  raw: CompactLesson,
  index: number,
  conceptsById: Map<string, Concept>,
  sourcesById: Map<string, SourceRef>,
  techById: Map<string, Tech>,
  diagramsById: Map<string, Diagram>,
): Lesson {
  const spec = archetypeSpec(raw.archetype);

  const facets: Facet[] | undefined = raw.facets
    ? FACET_ORDER.filter((k) => raw.facets![k])
        .map((k) => ({ key: k, label: spec.facetLabels[k], body: raw.facets![k]! }))
    : undefined;

  const callouts: Callout[] = CALLOUT_KEYS.filter((k) => raw[k]).map((k) => ({ kind: k, body: raw[k] as string }));

  const sources = (raw.sources ?? [])
    .map((id) => sourcesById.get(id))
    .filter((s): s is SourceRef => Boolean(s));

  const tech = (raw.tech ?? []).map((id) => techById.get(id)).filter((t): t is Tech => Boolean(t));

  const walkthrough = raw.walkthrough?.map((step) => {
    const src = step.src ? sourcesById.get(step.src) : undefined;
    return { path: src?.path, lines: src?.lines ?? undefined, code: step.code, note: step.note, highlight: step.highlight };
  });

  const quiz: QuizItem[] | undefined = raw.quiz?.map((q) => ({
    id: q.id,
    question: q.q,
    options: q.options,
    answerIndex: q.answer,
    hint: q.hint,
    explanation: q.why,
  }));

  // Recap: use authored recap, else derive from the lesson's concept summaries.
  let recap = raw.recap;
  if (!recap || recap.length === 0) {
    const derived = (raw.concepts ?? [])
      .map((id) => conceptsById.get(id))
      .map((c) => (c ? c.summary ?? c.name : null))
      .filter((s): s is string => Boolean(s));
    recap = derived.length ? derived : undefined;
  }

  return {
    id: raw.id,
    title: raw.title,
    order: raw.order ?? index + 1,
    archetype: raw.archetype,
    kind: spec.kind,
    icon: spec.icon,
    typeLabel: spec.label,
    est: raw.est,
    concepts: raw.concepts ?? [],
    explanations: raw.levels ?? {},
    facets,
    diagram: raw.diagram ? diagramsById.get(raw.diagram) : undefined,
    flow: raw.flow,
    walkthrough,
    tech: tech.length ? tech : undefined,
    compare: raw.compare,
    callouts: callouts.length ? callouts : undefined,
    sources: sources.length ? sources : undefined,
    quiz,
    exercise: raw.exercise,
    teachBack: raw.teachBack,
    recap,
    deeper: raw.deeper,
  };
}

export function expandCourse(compact: CompactCourse): Course {
  const reg = compact.registries ?? {};

  const concepts: Concept[] = Object.entries(reg.concepts ?? {}).map(([id, v]) => ({ id, ...v }));
  const tech: Tech[] = Object.entries(reg.tech ?? {}).map(([id, v]) => ({ id, ...v }));
  const diagrams: Diagram[] = Object.entries(reg.diagrams ?? {}).map(([id, v]) => ({ id, title: v.title, type: 'mermaid', code: v.code, nodes: v.nodes }));
  const glossary = Object.values(reg.glossary ?? {});

  const conceptsById = new Map(concepts.map((c) => [c.id, c]));
  const sourcesById = new Map(Object.entries(reg.sources ?? {}).map(([id, v]) => [id, { id, ...v } as SourceRef]));
  const techById = new Map(tech.map((t) => [t.id, t]));
  const diagramsById = new Map(diagrams.map((d) => [d.id, d]));

  const modules = [...compact.modules]
    .map((m, mi) => ({ ...m, order: m.order ?? mi + 1 }))
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      order: m.order,
      icon: m.icon,
      milestone: m.milestone,
      lessons: [...m.lessons]
        .map((l, li) => expandLesson(l, li, conceptsById, sourcesById, techById, diagramsById))
        .sort((a, b) => a.order - b.order),
    }));

  const themeName = selectTheme(compact.meta.category, compact.theme?.name);
  const levels = compact.meta.levels;
  const defaultLevel = compact.meta.defaultLevel ?? levels[0];

  return {
    schemaVersion: 2,
    meta: { ...compact.meta, defaultLevel },
    theme: {
      name: themeName,
      accent: compact.theme?.accent,
      motif: compact.theme?.motif,
      icon: compact.theme?.icon,
    },
    settings: { locking: compact.settings?.locking ?? 'recommended' },
    concepts,
    glossary,
    tech,
    diagrams,
    repoMap: compact.repoMap ?? null,
    modules,
  };
}

/** Validate a compact course and expand it, or throw with the collected errors. */
export function loadCourse(raw: unknown): Course {
  const result = validateCourse(raw);
  if (!result.ok) throw new Error(`Invalid course data:\n${result.errors.join('\n')}`);
  return expandCourse(raw as CompactCourse);
}
