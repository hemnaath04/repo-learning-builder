# repo-learning-builder

A [Claude Code](https://claude.com/claude-code) skill that turns any codebase,
GitHub URL, technical or non-technical topic, the current session's project, or a
set of documents into a **polished, interactive learning web app**.

You point it at a source, answer one short screen of questions, confirm the
proposed outline, and it generates a complete course: progressively unlocked
modules, quizzes with hints, mastery tracking with spaced repetition, an animated
repository explorer, a progress dashboard, adjustable explanation levels (from
"Explain like I'm 10" to Advanced), light/dark modes, four visual themes, search,
a glossary, and local progress that persists in the browser.

The web app is a **permanent template**. Each run generates only compact course
data plus a small theme config, never new UI, so courses are fast, cheap, and
consistent to produce.

|  |  |
| --- | --- |
| ![Course home](docs/home.jpg) | ![Lesson](docs/lesson.jpg) |

## What the learner gets

- **The five-minute story** and the problem the project solves, in plain language.
- A **complete request/user-action journey** traced end to end.
- The **architecture**, important files, and how they connect, each citing a real path.
- The **technologies** used and why they were chosen, with tradeoffs.
- How to **run, test, modify, extend, and debug** it, plus the honest limitations.
- A **teach-it-back** assessment so they can explain it to someone else.

## Design

- Editorial, code-editor-influenced visual system with a monospace utility voice.
- Four curated themes (Explorer, Laboratory, Storybook, Blueprint), each with
  independent light and dark modes, selected from the source category or by the learner.
- Accessible: keyboard navigation, visible focus, reduced-motion support,
  responsive from 360px to large desktops.

## Install

This repository **is** the skill. Clone it into your Claude Code skills folder:

```bash
git clone https://github.com/hemnaath04/repo-learning-builder \
  ~/.claude/skills/repo-learning-builder
```

Or add it to a single project instead of globally:

```bash
git clone https://github.com/hemnaath04/repo-learning-builder \
  .claude/skills/repo-learning-builder
```

Restart Claude Code (or start a new session) and the `repo-learning-builder`
skill will be available.

## Use

In Claude Code:

```
/repo-learning-builder
```

Then provide a source. Examples:

- **Current repo** — run it from inside a repository: `/repo-learning-builder`
- **A GitHub URL** — `/repo-learning-builder learn https://github.com/owner/project`
- **A topic** — `/repo-learning-builder teach me how DNS works for a beginner`

It inspects the source, asks one compact set of questions (with recommended
defaults and a "use defaults and build" fast path), shows the proposed outline
for one confirmation, then generates the course and the web app.

### Running the generated app

The generated app is standard React + TypeScript + Vite:

```bash
cd <generated-course-app>
npm install
npm run dev      # http://localhost:5173
npm run test     # unit + interaction tests
npm run build    # static build in dist/ (deploy anywhere)
```

## What's in here

```
SKILL.md                     # skill entry point and workflow
references/                  # how it analyzes sources, teaches, and stores progress
  source-analysis.md
  teaching-method.md         # lesson archetypes, facets, callouts
  curriculum-schema.md       # the compact v2 course.json schema
  progress-model.md          # persistence, mastery, spaced repetition
  design-system.md           # the four themes and design tokens
  generation-workflow.md     # token-efficient generation and incremental regen
scripts/                    # deterministic helpers (Node, no deps)
  analyze-repository.mjs      fingerprint-source.mjs   scaffold-course.mjs
  validate-course.mjs         validate-sources.mjs     expand-course.mjs
  plan-regeneration.mjs
assets/webapp-template/     # the permanent React + TS + Vite learning app
```

The bundled `assets/webapp-template/` ships a demo course so you can try the app
immediately (`cd assets/webapp-template && npm install && npm run dev`).

## How it stays fast and truthful

- **Generate data, not UI.** Lesson archetypes and shared registries (concepts,
  sources, tech, glossary, diagrams) mean generated data carries only
  source-specific content. See `references/generation-workflow.md`.
- **Every repository claim cites a real file**, checked by
  `scripts/validate-sources.mjs`. Inferences are labeled as inferences. Secrets
  are never read or shown.
- **Incremental regeneration** keyed by a source fingerprint (git SHA) preserves
  learner progress across regenerations via stable lesson and concept ids.

## License

MIT. See [LICENSE](LICENSE).
