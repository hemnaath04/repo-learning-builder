---
name: repo-learning-builder
description: >-
  Turn a repository, GitHub URL, topic, project, or a single source file into an
  interactive learning web app in the permanent "Atlas" design. One reusable app
  hosts many courses. Normal use only generates compact course JSON and adds it
  to the app; it never rebuilds or restyles the application. Works with small
  Haiku-class models by generating one lesson at a time against a strict schema.
  Use when the user wants to learn, teach, or onboard onto a repo, topic, or file.
---

# Repo Learning Builder

One permanent web app (the Atlas template) renders many courses. You generate
**compact course data only**. Never rebuild, redesign, or rewrite the app during
normal use.

Four separate parts:
1. Permanent app template: `assets/webapp-template/` (all UI, design, logic).
2. Deterministic scripts: `scripts/` (analysis, scaffold, validate, assemble, register, install).
3. Compact generated content: `public/courses/<id>/course.json` + `index.json`.
4. Deterministic validation and field-level repair.

## Normal invocation (the common path)

Triggers: `/repo-learning-builder <github url>`, `... teach me DNS`,
`... teach me auth from this project`, `... create a lesson about src/auth/session.ts`.

Do only this, in order. Do NOT touch `src/`.

1. **Fingerprint + analyze** the source:
   - `node scripts/fingerprint-source.mjs <path>`
   - If it matches an existing course's `meta.sourceFingerprint`, reuse it (stop or do incremental only).
   - `node scripts/analyze-source.mjs <path> --out source-manifest.json` (repos only).
     See `references/source-analysis.md`. Never dump files or secrets into context.
2. **Ask one compact questionnaire** with `AskUserQuestion` (offer "Use recommended defaults"):
   - Learner level: ELI10 / Beginner / Intermediate / Advanced
   - Goal: big picture / understand code / customize / contribute / present / mastery
   - Depth: quick / standard / deep
   - Style: visual / story / hands-on / code-first / balanced
   Skip anything the source or saved preferences already answer.
3. **Scaffold**: `node scripts/create-course-scaffold.mjs --id <id> --title "<t>" --source <kind> --depth <d> --manifest source-manifest.json --out scaffold.json`. This fixes course/module/lesson ids and archetypes. Do not invent extra layout.
4. **Plan**: run `prompts/plan-course.md` to fill titles, summaries, registries (concepts, technologies, sources, glossary). Write it into the scaffold.
5. **Generate lessons one at a time** with `prompts/generate-lesson.md`, giving the model only that lesson's scaffold, the learner level, allowed registry ids, and the relevant excerpts. Then `prompts/generate-quiz.md` for its checks. Respect the depth word budget in `references/teaching-rules.md`. Never generate the whole course in one response.
6. **Validate each lesson immediately**: `node scripts/validate-lesson.mjs <lesson.json>`. If invalid, pass only the reported fields to `prompts/repair-json.md`. Retry at most twice; then fall back to a minimal safe lesson.
7. **Glossary** (optional): `prompts/generate-glossary.md`.
8. **Assemble**: `node scripts/assemble-course.mjs --scaffold scaffold.json --lessons <dir> --out course.json`, then `node scripts/validate-lesson.mjs course.json --course` and fix errors.
9. **Install app if missing, then add the course as data**:
   - First time only: `node scripts/install-template.mjs --dest <app>` then `npm --prefix <app> install`.
   - Copy `course.json` to `<app>/public/courses/<id>/course.json`.
   - `node scripts/register-course.mjs --app <app> --course <app>/public/courses/<id>/course.json`.
10. **Run**: `npm --prefix <app> run dev` (or `run build`). Confirm the course loads.

Adding a second course repeats steps 1-9 and changes only files under
`public/courses/`. Never edit `src/`, `package.json`, or reinstall dependencies.

## First installation vs normal use

- First install copies the template once and runs `npm install` once.
- Normal use never copies app code, never edits `package.json`, never reinstalls.
  `install-template.mjs` is idempotent and refuses to overwrite `src/` without
  `--force`.

## Incremental updates

Re-fingerprint. If unchanged, reuse. Otherwise map changed files to source ids,
regenerate only the lessons that cite them, keep the rest, and preserve progress
via stable lesson ids (`references/source-analysis.md`).

## Model responsibilities

The model MAY: choose concepts, explain verified behavior, write analogies,
exercises, quizzes, and adapt difficulty.
The model MUST NOT: build components, write CSS, choose dependencies, rewrite
schemas, copy the template by hand, invent behavior, read every file, or
regenerate valid unchanged lessons. Full list in `references/teaching-rules.md`.

## References (load only when needed)

- `references/course-schema.md` compact v3 schema, registries, archetypes, app layout.
- `references/teaching-rules.md` voice, the five questions, callouts, budgets, do/don't.
- `references/source-analysis.md` fingerprint, manifest, caching, incremental regen.

## Scripts

`fingerprint-source.mjs`, `analyze-source.mjs`, `create-course-scaffold.mjs`,
`validate-lesson.mjs`, `assemble-course.mjs`, `register-course.mjs`,
`install-template.mjs`. All deterministic, Node, no dependencies.

## Prompts (Haiku-friendly, one artifact each)

`plan-course.md`, `generate-lesson.md`, `generate-quiz.md`,
`generate-glossary.md`, `repair-json.md`.

## Hard rules

- Never rebuild, redesign, or rewrite the app during normal use.
- Generate data, not UI. Adding a course changes only `public/courses/`.
- Cite real source ids; never invent files or behavior; never show secrets.
- Generate one lesson at a time; validate and repair field-by-field.
- No filler to hit a lesson count. No em dashes.
