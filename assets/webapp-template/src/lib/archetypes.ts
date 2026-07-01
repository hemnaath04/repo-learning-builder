// Lesson archetypes for the Atlas renderer. All fixed labels live here so
// generated course data never repeats headings or UI copy.

export type Archetype =
  | 'overview' | 'story' | 'concept' | 'technology' | 'architecture'
  | 'request-flow' | 'code-walkthrough' | 'comparison' | 'debugging'
  | 'exercise' | 'customization' | 'final-project' | 'teach-back';

export type Accent = 'ultramarine' | 'coral' | 'mint' | 'ink';

export interface ArchetypeSpec { label: string; icon: string; accent: Accent }

export const ARCHETYPES: Record<Archetype, ArchetypeSpec> = {
  overview: { label: 'Overview', icon: 'Compass', accent: 'ultramarine' },
  story: { label: 'Story', icon: 'BookOpen', accent: 'coral' },
  concept: { label: 'Concept', icon: 'Lightbulb', accent: 'ultramarine' },
  technology: { label: 'Technology', icon: 'Cpu', accent: 'mint' },
  architecture: { label: 'Architecture', icon: 'Network', accent: 'ink' },
  'request-flow': { label: 'Request flow', icon: 'Route', accent: 'coral' },
  'code-walkthrough': { label: 'Code walkthrough', icon: 'Code2', accent: 'ink' },
  comparison: { label: 'Comparison', icon: 'Scale', accent: 'ultramarine' },
  debugging: { label: 'Debugging', icon: 'Bug', accent: 'coral' },
  exercise: { label: 'Exercise', icon: 'Dumbbell', accent: 'mint' },
  customization: { label: 'Customization', icon: 'Wrench', accent: 'mint' },
  'final-project': { label: 'Project', icon: 'Rocket', accent: 'coral' },
  'teach-back': { label: 'Teach it back', icon: 'Mic', accent: 'ink' },
};

export function archetypeSpec(a: Archetype | undefined): ArchetypeSpec {
  return ARCHETYPES[a ?? 'concept'] ?? ARCHETYPES.concept;
}

// The five questions, labelled once by the renderer.
export const SECTION_LABELS: Record<string, string> = {
  what: 'What is it?',
  why: 'Why does it exist?',
  how: 'How does it work?',
  connects: 'What connects to it?',
  ifChanged: 'What happens if it changes?',
};
export const SECTION_ORDER = ['what', 'why', 'how', 'connects', 'ifChanged'] as const;

export const CALLOUT_LABELS: Record<string, { label: string; icon: string }> = {
  example: { label: 'Example', icon: 'Sparkles' },
  analogy: { label: 'Analogy', icon: 'Quote' },
  insight: { label: 'Insight', icon: 'Lightbulb' },
  warning: { label: 'Watch out', icon: 'TriangleAlert' },
};
