# Design System and Themes

The visual system is permanent, in `assets/webapp-template/src/index.css`. Claude
never generates CSS per course. You only pick a theme and, optionally, set a few
`themeConfig` values.

## Tokens (theme-independent)

Spacing, radius, shadow, motion, and a fluid type scale (`--step--1` .. `--step-4`)
plus a comfortable `--reading` width live in `:root`. Body font is Inter; display
fonts are Fraunces or Space Grotesk depending on theme; code is JetBrains Mono.
All degrade to system fonts offline.

## The four themes

Selected by `data-theme-name` and combined with `data-theme` (light/dark), each
mode designed independently. Colors are semantic tokens: `--bg`, `--surface`,
`--surface-2`, `--elevated`, `--text`, `--text-muted`, `--border`, `--primary`,
`--secondary`, `--accent`, `--success`, `--warning`, `--danger`, `--soft`.

| Theme | Feel | Display | Motif | Fits categories |
| --- | --- | --- | --- | --- |
| Explorer | warm, map-like | Fraunces | hex dots | web-app, frontend, mobile |
| Laboratory | precise, technical | Space Grotesk | circuit grid | backend, api, data, ai-ml |
| Storybook | editorial, friendly | Fraunces | page dots | topic, concept, docs |
| Blueprint | architectural | Space Grotesk | grid | cli, library, devops, infra |

Selection is deterministic via `src/lib/theme.ts` `selectTheme(category, override)`.
Unknown categories fall back to Storybook. The learner can switch themes in the
top bar; the choice persists.

## themeConfig (per course, no new UI)

```jsonc
"theme": { "name": "auto", "accent": "#c1592a", "motif": "hex", "icon": "Sprout" }
```

- `name`: a theme name or `auto` (use the category mapping).
- `accent`: overrides `--primary` (cover, buttons, highlights) without new CSS.
- `motif`: cover/certificate background pattern.
- `icon`: a lucide icon name for the cover and brand mark (see `src/components/Icon.tsx`
  for the curated set; unknown names fall back safely).

## Built-in states and accessibility

Skeleton, empty, and error states; light/dark designed separately; visible focus
rings; keyboard navigation (arrow keys between lessons, tabbable facets/quizzes);
`prefers-reduced-motion` disables animation; responsive from 360px to large
desktops; the Overview metadata uses an auto-fit grid with wrapping so cards
never overlap.
