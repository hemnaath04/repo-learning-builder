# Course schema (compact v3)

One course is one `public/courses/<id>/course.json`. The app loads it at runtime.
The renderer supplies every fixed label; generated data carries only values.

## App layout (one app, many courses)

```
learning-app/
├── src/                     # permanent template (never edited to add a course)
├── public/courses/
│   ├── index.json           # registry: { "courses": [ {id,title,subtitle,category,estimatedMinutes,modules,lessons,updatedAt} ] }
│   ├── claimfarm/course.json
│   └── dns/course.json
├── package.json             # permanent
└── package-lock.json        # permanent
```

## course.json

```jsonc
{
  "schemaVersion": 3,
  "meta": {
    "id","title","subtitle","promise",
    "sourceType": "repository|github-url|topic|lesson|documents",
    "sourceRef","sourceFingerprint","generatedAt",
    "category": "ai-ml|backend|web-app|mobile|cli|data|topic|...",
    "audience","goal","depth": "quick|standard|deep","style",
    "estimatedMinutes","outcomes": ["..."],
    "levels": ["eli10","beginner","intermediate","advanced"], "defaultLevel": "beginner"
  },
  "registries": {
    "concepts":     { "c-x": { "name","summary" } },
    "technologies": { "t-x": { "name","purpose","location","alternatives","tradeoffs" } },
    "sources":      { "s-x": { "path","lines","note" } },
    "glossary":     { "g-x": { "term","definition","seeAlso" } },
    "landmarks":    { "lm-x": { "title","icon" } }        // optional
  },
  "checks":   { "chk-x": { "q","options":["..."],"answer":0,"hint","why" } },  // quiz registry
  "diagrams": { "d-x": { "title","code" } },               // mermaid
  "repoMap":  { "name","kind":"dir|file","path","role","importance":0-3,"children":[] },
  "modules": [
    { "id","title","summary","icon", "lessons": [ Lesson ] }
  ]
}
```

## Lesson (compact)

```jsonc
{
  "id","type": "<archetype>","title","summary","est","difficulty",
  "conceptIds": ["c-x"], "sourceIds": ["s-x"], "techIds": ["t-x"],
  "sections": { "what","why","how","connects","ifChanged" },  // renderer labels these
  "example","analogy","insight","warning",                     // callouts
  "checks": ["chk-x"],                                          // reference the checks registry
  "activity": "try-it text",
  "diagram": "d-x",
  "walkthrough": [ { "src": "s-x", "code","note","highlight":[3,4] } ],
  "flow": [ { "actor","action","note" } ],
  "compare": { "a","b","rows":[{ "aspect","a","b" }] },
  "teachBack": "prompt","deeper": "optional"
}
```

Only `id`, `title`, `type` are required. Omit any field that does not apply; the
renderer skips absent blocks and supplies all headings (the five questions,
Example, Analogy, Knowledge check, Try it yourself, Go deeper).

## Archetypes

`overview, story, concept, technology, architecture, request-flow,
code-walkthrough, comparison, debugging, exercise, customization, final-project,
teach-back`. The archetype sets the lesson icon and badge; content is data.

## Rules enforced by validate-lesson.mjs

- lesson: `id`, `title`, valid `type`, and at least one of sections/summary/
  walkthrough/flow/compare.
- section keys limited to what/why/how/connects/ifChanged.
- check: `q`, `options` (>= 2), `answer` in range.
- ids unique; lesson refs to unknown concept/source/check ids are errors in the
  whole-course pass.

## Stable ids and progress

Keep lesson and concept ids stable across regenerations. Progress is stored per
`courseId` and migrates by id, so unchanged lessons keep their progress.
