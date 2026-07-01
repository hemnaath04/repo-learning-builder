# Course Data Schema (compact v2)

Course content is one versioned JSON file (`course.json`), separate from UI.
Generation produces the **compact** shape below; `src/lib/expand.ts` expands it
into the runtime model the components consume, supplying every repeated label so
generated data stays small. `scripts/validate-course.mjs` enforces this schema.
Markdown is allowed in any text field rendered as content.

## Top level

```jsonc
{
  "schemaVersion": 2,
  "meta": { ... },          // required
  "theme": { ... },          // optional themeConfig (name auto-selected if omitted)
  "settings": { "locking": "recommended" | "strict" }, // default recommended
  "registries": { ... },     // shared, id-keyed: concepts, sources, tech, glossary, diagrams
  "repoMap": { ... } | null, // optional file tree with importance
  "modules": [ ... ]         // required, >= 1
}
```

## meta (required)

```jsonc
{
  "id": "kebab-id", "title": "...", "subtitle": "...", "promise": "one line",
  "sourceType": "repository|github-url|topic|session|documents|lesson",
  "sourceRef": "path / url / topic", "sourceFingerprint": "git sha or hash",
  "generatedAt": "ISO-8601",
  "category": "web-app|frontend|mobile|cli|library|devops|backend|api|data|ai-ml|topic|docs",
  "audience": "...", "goal": "...", "depth": "quick|standard|deep", "style": "...",
  "estimatedMinutes": 90,
  "outcomes": ["You will be able to ..."],          // powers the home outcomes
  "levels": ["eli10","beginner","intermediate","advanced"],
  "defaultLevel": "beginner"                          // must be in levels
}
```

`category` selects the theme (see `design-system.md`).

## theme (themeConfig, optional)

```jsonc
{ "name": "explorer|laboratory|storybook|blueprint|auto",
  "accent": "#hex",        // optional accent override
  "motif": "hex|circuit|pages|grid", "icon": "Sprout" }  // lucide icon name
```

## registries (shared, referenced by id)

```jsonc
"registries": {
  "concepts": { "c-x": { "name": "Routing", "summary": "one line", "moduleId": "m-arch" } },
  "sources":  { "s-x": { "path": "src/index.ts", "lines": "1-40", "note": "entry point" } },
  "tech":     { "t-x": { "name": "FastAPI", "purpose": "...", "location": "...", "alternatives": "...", "tradeoffs": "..." } },
  "glossary": { "g-x": { "term": "API", "definition": "...", "seeAlso": ["HTTP"] } },
  "diagrams": { "d-x": { "title": "Architecture", "type": "mermaid", "code": "flowchart TD; A-->B" } }
}
```

## modules and lessons (compact)

```jsonc
{
  "id": "m-arch", "title": "...", "summary": "...", "order": 2,
  "icon": "Network", "milestone": "shown after this module",
  "lessons": [
    {
      "id": "l-arch", "title": "...", "order": 1,
      "archetype": "concept|story|architecture|code-walkthrough|request-flow|technology|exercise|debugging|comparison|final-project|teach-back",
      "est": 8, "concepts": ["c-x"],           // concept ids (mastery units)
      "levels": { "eli10": "...", "beginner": "...", "intermediate": "...", "advanced": "..." },
      "facets": { "what": "...", "why": "...", "how": "...", "whatif": "..." }, // labels come from the archetype
      "example": "...", "analogy": "...", "insight": "...", "warning": "...", "experiment": "...", // callouts
      "sources": ["s-x"],                       // source ids -> shown contextually
      "diagram": "d-x",                          // diagram id
      "flow": [ { "actor": "...", "action": "...", "note": "..." } ],  // request-flow steps
      "walkthrough": [ { "src": "s-x", "code": "...", "note": "...", "highlight": [3,4] } ],
      "tech": ["t-x"],                           // technology ids -> tech cards
      "compare": { "a": "Option A", "b": "Option B", "rows": [ { "aspect": "...", "a": "...", "b": "..." } ] },
      "quiz": [ { "id": "q-x", "q": "...", "options": ["..."], "answer": 0, "hint": "...", "why": "explanation" } ],
      "exercise": { "id": "ex-x", "prompt": "...", "checklist": ["..."] },
      "teachBack": "Explain ... in your own words.",
      "recap": ["point"],                        // optional; derived from concept summaries if omitted
      "deeper": "optional go-deeper markdown"
    }
  ]
}
```

Every field except `id`, `title`, `archetype` is optional. The renderer omits a
section when its data is absent and supplies all facet labels, the lesson kind,
icon, and default recap from the archetype. Do not hand-write "What is it? / Why
is it here?" prose; put the answers in `facets` and let the renderer label them.

## repoMap (optional)

```jsonc
{ "name": "root", "kind": "dir", "path": ".", "role": "one line",
  "importance": 3,                               // 0-3, shows dots in the explorer
  "children": [ { "name": "src", "kind": "dir", "path": "src", "role": "...", "importance": 2, "children": [] } ] }
```

## Required-field summary (enforced)

- top: `schemaVersion === 2`, `meta`, `modules` (non-empty).
- meta: `id`, `title`, `sourceType`, `generatedAt`, non-empty `levels`,
  `defaultLevel` in `levels`.
- module: `id`, `title`, non-empty `lessons`.
- lesson: `id`, `title`, valid `archetype`.
- quiz item: `id`, `q`, `options` (>= 2), `answer` in range.
- ids unique across modules/lessons/quizzes/registries.
- Referential issues (a lesson citing an unknown source/tech/concept/diagram id)
  are warnings, not errors.

## Versioning and regeneration

Keep lesson and concept `id`s stable across regenerations so learner progress is
preserved. Store the new `meta.sourceFingerprint`. Use
`scripts/plan-regeneration.mjs` to diff old vs new. Bump `schemaVersion` only for
breaking changes.
