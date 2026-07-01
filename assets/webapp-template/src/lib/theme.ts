// The four curated visual themes and deterministic selection from a course
// category. Themes are defined once in CSS (see index.css) and selected here;
// Claude never generates CSS per course.

export type ThemeName = 'explorer' | 'laboratory' | 'storybook' | 'blueprint';
export type Motif = 'hex' | 'circuit' | 'pages' | 'grid';

export interface ThemeSpec {
  name: ThemeName;
  label: string;
  motif: Motif;
  icon: string; // default lucide icon
  blurb: string;
}

export const THEMES: Record<ThemeName, ThemeSpec> = {
  explorer: { name: 'explorer', label: 'Explorer', motif: 'hex', icon: 'Compass', blurb: 'Warm, map-like, for journeys through a system.' },
  laboratory: { name: 'laboratory', label: 'Laboratory', motif: 'circuit', icon: 'FlaskConical', blurb: 'Precise and technical, for backends and data.' },
  storybook: { name: 'storybook', label: 'Storybook', motif: 'pages', icon: 'BookOpen', blurb: 'Editorial and friendly, for concepts and topics.' },
  blueprint: { name: 'blueprint', label: 'Blueprint', motif: 'grid', icon: 'Ruler', blurb: 'Architectural and structured, for systems design.' },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

// Category -> theme. Categories come from source analysis. Anything unknown
// falls back to a stable default rather than a random pick.
const CATEGORY_THEME: Record<string, ThemeName> = {
  'web-app': 'explorer',
  frontend: 'explorer',
  mobile: 'explorer',
  cli: 'blueprint',
  library: 'blueprint',
  devops: 'blueprint',
  infra: 'blueprint',
  backend: 'laboratory',
  api: 'laboratory',
  data: 'laboratory',
  'ai-ml': 'laboratory',
  topic: 'storybook',
  concept: 'storybook',
  docs: 'storybook',
};

export function selectTheme(category: string | undefined, override?: string): ThemeName {
  if (override && (THEME_NAMES as string[]).includes(override)) return override as ThemeName;
  if (category) {
    const key = category.toLowerCase();
    if (CATEGORY_THEME[key]) return CATEGORY_THEME[key];
  }
  return 'storybook';
}

export function themeSpec(name: ThemeName): ThemeSpec {
  return THEMES[name] ?? THEMES.storybook;
}
