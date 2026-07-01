// Lesson archetypes. This is the core token-saving mechanism: every repeated
// label, heading, facet name, lesson "kind", icon, and default section order
// lives here in the permanent template. Generated course data only carries
// source-specific content, never these structural strings.

export type Archetype =
  | 'concept'
  | 'story'
  | 'architecture'
  | 'code-walkthrough'
  | 'request-flow'
  | 'technology'
  | 'exercise'
  | 'debugging'
  | 'comparison'
  | 'final-project'
  | 'teach-back';

// The visual family a lesson belongs to. Drives the badge color and icon so
// quick reads, deep dives, challenges, and projects look distinct.
export type LessonKind = 'quick' | 'deep' | 'challenge' | 'project';

export interface FacetLabels {
  what: string;
  why: string;
  how: string;
  whatif: string;
}

export interface ArchetypeSpec {
  label: string;
  kind: LessonKind;
  icon: string; // lucide icon name
  tagline: string;
  facetLabels: FacetLabels;
}

const DEFAULT_FACETS: FacetLabels = {
  what: 'What is it?',
  why: 'Why does it exist?',
  how: 'How does it work?',
  whatif: 'What if it changed?',
};

export const ARCHETYPES: Record<Archetype, ArchetypeSpec> = {
  concept: {
    label: 'Concept',
    kind: 'quick',
    icon: 'Lightbulb',
    tagline: 'A single idea, made clear.',
    facetLabels: DEFAULT_FACETS,
  },
  story: {
    label: 'Story',
    kind: 'quick',
    icon: 'BookOpen',
    tagline: 'The narrative that frames everything.',
    facetLabels: {
      what: 'What is the story?',
      why: 'Why does it matter?',
      how: 'How does it play out?',
      whatif: 'What if it were different?',
    },
  },
  architecture: {
    label: 'Architecture',
    kind: 'deep',
    icon: 'Network',
    tagline: 'How the pieces connect.',
    facetLabels: {
      what: 'What are the parts?',
      why: 'Why this shape?',
      how: 'How do they talk?',
      whatif: 'What if we rewired it?',
    },
  },
  'code-walkthrough': {
    label: 'Code walkthrough',
    kind: 'deep',
    icon: 'Code2',
    tagline: 'Reading the real code, line by line.',
    facetLabels: DEFAULT_FACETS,
  },
  'request-flow': {
    label: 'Request flow',
    kind: 'deep',
    icon: 'Route',
    tagline: 'Follow one action end to end.',
    facetLabels: {
      what: 'What triggers it?',
      why: 'Why this path?',
      how: 'How does data move?',
      whatif: 'What if a step failed?',
    },
  },
  technology: {
    label: 'Technology',
    kind: 'quick',
    icon: 'Cpu',
    tagline: 'The tool and why it was chosen.',
    facetLabels: {
      what: 'What is it?',
      why: 'Why this tool?',
      how: 'How is it used here?',
      whatif: 'What are the alternatives?',
    },
  },
  exercise: {
    label: 'Exercise',
    kind: 'challenge',
    icon: 'Dumbbell',
    tagline: 'Do it yourself.',
    facetLabels: DEFAULT_FACETS,
  },
  debugging: {
    label: 'Debugging',
    kind: 'challenge',
    icon: 'Bug',
    tagline: 'Find it, understand it, fix it.',
    facetLabels: {
      what: 'What breaks?',
      why: 'Why does it break?',
      how: 'How do you fix it?',
      whatif: 'What if it recurs?',
    },
  },
  comparison: {
    label: 'Comparison',
    kind: 'quick',
    icon: 'Scale',
    tagline: 'Weigh the options.',
    facetLabels: DEFAULT_FACETS,
  },
  'final-project': {
    label: 'Project',
    kind: 'project',
    icon: 'Rocket',
    tagline: 'Put it all together.',
    facetLabels: DEFAULT_FACETS,
  },
  'teach-back': {
    label: 'Teach it back',
    kind: 'project',
    icon: 'Mic',
    tagline: 'Prove you can explain it.',
    facetLabels: DEFAULT_FACETS,
  },
};

export function archetypeSpec(a: Archetype | undefined): ArchetypeSpec {
  return ARCHETYPES[a ?? 'concept'] ?? ARCHETYPES.concept;
}

export const LESSON_KIND_META: Record<LessonKind, { label: string; icon: string }> = {
  quick: { label: 'Quick read', icon: 'Zap' },
  deep: { label: 'Deep dive', icon: 'Layers' },
  challenge: { label: 'Challenge', icon: 'Target' },
  project: { label: 'Project', icon: 'Rocket' },
};

// Canonical order the lesson renderer walks. A block only renders if the
// expanded lesson has content for it, so archetypes never need to list sections.
export const SECTION_ORDER = [
  'explanation',
  'facets',
  'diagram',
  'flow',
  'walkthrough',
  'tech',
  'compare',
  'callouts',
  'sources',
  'quiz',
  'exercise',
  'teachback',
  'recap',
  'deeper',
] as const;
