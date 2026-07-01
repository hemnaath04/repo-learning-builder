# Generation Workflow and Token Efficiency

The application is a permanent asset. Generation produces data, not UI. This is
the main efficiency lever: the React app, design system, themes, components,
navigation, progress logic, quiz engine, diagram renderer, storage, search, and
accessibility all live in `assets/webapp-template/` and are reused unchanged.

## What is permanent vs generated

| Permanent (template) | Generated per course |
| --- | --- |
| React app + components | Compact `course.json` |
| Design system + 4 themes | `meta`, modules, lessons |
| Archetype labels/structure | Diagrams (Mermaid code) |
| Progress + mastery + spaced repetition | Activities and quizzes |
| Diagram renderer, search, storage | Source references + registries |
| Accessibility + keyboard behavior | A small `themeConfig` |

## Keep generation small

- Use **archetypes**: never repeat "What is it? / Why is it here? / How does it
  work?" in data. Put answers in `facets`; the renderer labels them.
- Use **registries**: define each concept, source, tech, glossary term, and
  diagram once, reference by id. A file cited by five lessons is one entry.
- Rely on **defaults**: omit any optional field. The recap is derived from
  concept summaries when absent. Sections render only when data exists.
- Reuse **concept ids** across lessons so mastery aggregates correctly.

## Depth budgets (do not pad)

- Quick tour: 3-5 lessons
- Standard: 6-12 lessons
- Deep dive: 12-24 lessons

Generate the number the source actually justifies. Never add filler to reach a
target.

## One analysis pass, cached by fingerprint

Run `scripts/analyze-repository.mjs` and `scripts/fingerprint-source.mjs` once.
Store the fingerprint in `meta.sourceFingerprint` (prefer the git SHA). Reuse the
analysis for the whole generation; if invoked again on the same fingerprint, the
course can be reused as-is.

## Incremental regeneration

When the source changes:

1. Recompute the fingerprint. If unchanged, reuse the existing course.
2. Diff with `scripts/plan-regeneration.mjs <old.json> <new.json>`.
3. Keep lessons whose ids are stable (their content and the learner's progress
   survive). Only regenerate `added` lessons; drop `removed` ones.
4. Progress migrates automatically by id (`src/lib/progress.ts`), so keep ids
   stable whenever the lesson's identity is unchanged.

## Deterministic scripts

`scaffold-course.mjs` (skeleton), `validate-course.mjs` (schema),
`validate-sources.mjs` (every cited path is real), `expand-course.mjs`
(compact -> runtime summary), `fingerprint-source.mjs`, `plan-regeneration.mjs`,
`analyze-repository.mjs`. Always validate the course and the source references
before shipping.
