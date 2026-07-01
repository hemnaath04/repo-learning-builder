# Source analysis

Analysis is deterministic and cached. The model consumes a compact manifest, not
raw files.

## Step 1: fingerprint

`node scripts/fingerprint-source.mjs <repoPath>` returns a stable fingerprint
(git SHA when available, else a content hash). If it matches the course's
`meta.sourceFingerprint`, reuse the existing analysis and course; skip re-work.

## Step 2: analyze

`node scripts/analyze-source.mjs <repoPath> --out source-manifest.json` produces
a small JSON summary:

- source type, fingerprint, category (drives nothing visual now; informational)
- languages, frameworks/dependencies (names only), package manager
- entry points, important directories, important files
- tests present, authentication present, database/storage present
- candidate APIs, README section headings
- a depth-limited repoMap with importance hints

Limit what reaches the model to relevant items. Never dump whole files into
context. Never read or emit secrets; use `.env.example` for shape, never `.env`.

## Depth: for "deep", read the whole codebase (not the README)

The README is orientation only, never the sole source. For a deep course:

- Enumerate the real technologies from manifests AND imports (e.g. every `import`
  in Python/JS), not just the stack table in the README.
- Walk every source directory and read the real files: entry points, routes/API,
  agents/services, clients/integrations, models/schemas, storage/db, auth,
  middleware, workers, config, and the tests (tests show intended behavior).
- Teach one lesson per real subsystem or technology that a contributor must
  understand (e.g. webhook signature verification, the rate limiter and security
  headers, the vector-store abstraction, password hashing and RBAC, the weather
  aggregation, the PDF/render path), each with a real code walkthrough and exact
  file citations.
- Prefer real function/class names and real snippets over generic description.
  Do not stop at "what the README says the app does".
- Use `scripts/analyze-source.mjs` to map files, then read the important ones;
  size the course to the depth budget in `teaching-rules.md` (deep = 12-20).

## Topic and single-lesson modes

- Topic (`teach me DNS`): no repo. Skip analysis; plan from prerequisites,
  core ideas, mental models, examples, and an exercise.
- Single lesson (`create a lesson about src/auth/session.ts`): analyze only that
  file and its immediate imports; scaffold one lesson.

## Fact vs inference

Tag claims as fact (cite a source id) or inference (hedge: "likely", "appears
to"). Every repository claim in a lesson must cite a real source id that resolves
to a path in the manifest. `scripts/validate-lesson.mjs --course` flags unknown
source ids.

## Incremental regeneration

When a repo changes: recompute the fingerprint; if unchanged, reuse. Otherwise
map changed files to affected source ids, regenerate only the lessons that cite
them, keep every other lesson, and preserve progress via stable lesson ids.
