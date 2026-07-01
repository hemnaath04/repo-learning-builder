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
