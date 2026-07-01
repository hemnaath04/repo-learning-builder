---
name: repo-learning-builder
description: >-
  Turn any codebase, GitHub URL, technical or non-technical topic, the current
  session's project, Claude project memory, a specific lesson, or uploaded
  documents into a polished, premium interactive learning web app. Ships a
  permanent React + TypeScript + Vite application template with four curated
  visual themes (Explorer, Laboratory, Storybook, Blueprint), a lesson-archetype
  renderer, quizzes, mastery + spaced repetition, an animated repository
  explorer, a progress dashboard with a concept-mastery radar, notes, bookmarks,
  search, glossary, adjustable explanation levels (Explain Like I'm 10 through
  Advanced), light/dark modes, keyboard navigation, and local progress. Each run
  generates only compact course data (metadata, modules, lessons, diagrams,
  source references, a small theme config), never new UI. Use when the user
  wants to learn, teach, onboard onto, or build a course from a repo, project,
  topic, lesson, or documents.
---

# Repo Learning Builder

Transform a source into a premium interactive learning web app. Future runs
reuse the bundled application template. You generate **course data + a small
theme config only**. Do not rebuild the React interface for each course.

The learner should leave able to explain what the thing is, what problem it
solves, who uses it, how it works end to end, the technologies and why, how the
important files connect, how to run/test/modify/extend/debug it, the tradeoffs,
and how to teach it to someone else. A motivated 10-year-old must follow the
`eli10` level. Introduce every term before using it.

## Workflow (do not skip steps)

### 1. Inspect, then ask one compact screen

Quietly inspect available context first (working dir, git, open files, recalled
memory, attached docs). If a source is already obvious, say so and skip asking
about it. Then ask ONE compact set of questions with `AskUserQuestion`, each
with a recommended default and an "Other" escape. Offer "Use recommended
defaults and build" as the fast path.

1. **Source**: detected source / current repo / GitHub URL / topic / specific
   lesson / current session / documents
2. **Learner level**: ELI10 / Beginner / Intermediate / Advanced
3. **Goal**: big picture / understand the code / customize / contribute /
   present it / master everything
4. **Depth**: quick tour / standard / deep dive
5. **Learning style**: visual / story / hands-on / code-first / balanced

Do not re-ask anything the repo context or saved preferences already answer.

### 2. Analyze the source once, and cache it

Follow `references/source-analysis.md`. Do a single analysis pass. Compute a
fingerprint (`scripts/fingerprint-source.mjs`, prefers the git SHA) and record
it as `meta.sourceFingerprint` so the analysis is cacheable and regeneration can
be incremental. Separate verified facts from inferences, cite exact file paths,
never invent behavior, never print secrets.

### 3. Confirm the plan (one confirmation)

Show your understanding of the learner, the detected source + category (which
picks the theme), the proposed outline, the app features, and any assumptions.
Get a single confirmation.

### 4. Generate compact course data (not UI)

Author a compact v2 `course.json` per `references/curriculum-schema.md`. Use
lesson **archetypes** (`references/teaching-method.md`) so the renderer supplies
all repeated labels, facet names, headings, icons, and lesson kinds. Put shared
material in the **registries** (concepts, sources, tech, glossary, diagrams) and
reference it by id. Respect the depth budget: quick 3-5, standard 6-12, deep
12-24 lessons. Do not generate filler to hit a count. Pick the theme from the
category (or learner choice) per `references/design-system.md`.
`scripts/scaffold-course.mjs` emits a valid skeleton to fill in.

### 5. Build the app (copy the template, drop in data)

Copy `assets/webapp-template/` to the chosen location and place your generated
`course.json` in `src/data/`. That is it. The template already contains the
design system, four themes, components, navigation, quiz engine, diagram
renderer, mastery + spaced repetition, storage, search, and accessibility. If
the host repo already has a suitable stack, match it; otherwise use the template.

### 6. Validate and verify

- `node scripts/validate-course.mjs <course.json>` and fix every error.
- `node scripts/validate-sources.mjs <course.json> <repoPath>` so every cited
  path is real.
- `node scripts/expand-course.mjs <course.json>` to sanity-check the expansion.
- In the app: `npm install`, `npm run test`, `npm run build`. Fix failures.
- Open it and confirm one real flow (home, a lesson, a quiz, progress persists).

### 7. Deliver

Report the structure, run commands, what you verified, and any limitations or
unverified inferences.

## Reference files

- `references/source-analysis.md` analyze repos/topics/sessions/docs; category,
  fingerprint, caching, budgets.
- `references/teaching-method.md` archetypes, facets, callouts, lesson anatomy.
- `references/curriculum-schema.md` the compact v2 `course.json` schema.
- `references/progress-model.md` persistence, mastery, spaced repetition.
- `references/design-system.md` the four themes, tokens, and `themeConfig`.
- `references/generation-workflow.md` token-efficient generation and
  incremental regeneration.

## Scripts (deterministic helpers)

- `analyze-repository.mjs <repoPath>` languages, manifests, entry points, map.
- `fingerprint-source.mjs <repoPath>` stable source fingerprint (git SHA first).
- `scaffold-course.mjs <id> [title] [category]` emit a compact skeleton.
- `validate-course.mjs <course.json>` validate against the v2 schema.
- `validate-sources.mjs <course.json> <repoPath>` every cited path must exist.
- `expand-course.mjs <course.json>` summarize the compact -> runtime expansion.
- `plan-regeneration.mjs <old.json> <new.json>` diff ids for incremental regen.

## Hard rules

- Inspect and ask before building; one confirmation before implementing.
- Generate data, not UI. Reuse the permanent template.
- Cite real file paths; label inferences; never reveal secrets.
- No paid service required for the default local mode.
- Every visual must improve understanding. No filler, no em dashes.
- Mastery is demonstrated (quiz, exercise, teach-back), not just opening a page.
