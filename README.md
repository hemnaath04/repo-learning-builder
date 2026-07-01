# repo-learning-builder

A [Claude Code](https://claude.com/claude-code) skill that turns a **repository, GitHub URL, topic, or a single source file** into an interactive learning web app in the permanent **Atlas** design.

One reusable app hosts many courses. Each run generates only **compact course JSON**, never new UI, so courses are fast, cheap, and consistent to produce, and it works with small **Haiku-class** models by generating one lesson at a time against a strict schema.

![Learning atlas](docs/home.jpg)

| Lesson | Mobile |
| --- | --- |
| ![Lesson](docs/lesson.jpg) | ![Mobile](docs/mobile.jpg) |

## The Atlas experience

- A full-width top bar, a compact course identity strip, and a **spatial learning atlas**: landmark cards connected by an SVG path, with a contextual lesson dock.
- Palette: gallery white `#F7F8FC`, ink `#151722`, ultramarine `#2447F9`, coral `#FF6258`, mint `#BDF3D8`, fog `#E8EAF2`. Type: Space Grotesk + Inter.
- Responsive: desktop spatial atlas + right dock, tablet compact atlas + bottom panel, mobile vertical connected journey + bottom sheet.
- Every lesson: the five questions (What / Why / How / What connects / What if it changes), an example, an analogy, source citations, an activity, and a knowledge check. Plus progress, mastery with spaced repetition, notes, bookmarks, search, glossary, a repository explorer, light/dark, and keyboard navigation.

## Install

### Option A — Claude Code plugin marketplace (recommended)

```
/plugin marketplace add hemnaath04/repo-learning-builder
/plugin install repo-learning-builder@hemnaath-skills
```

Update later with `/plugin marketplace update hemnaath-skills` then `/plugin update repo-learning-builder`.
Installed as a plugin, invoke it as `/repo-learning-builder:repo-learning-builder`.

### Option B — clone into your skills folder

The repo is also a standalone skill (`SKILL.md` at the root):

```bash
git clone https://github.com/hemnaath04/repo-learning-builder \
  ~/.claude/skills/repo-learning-builder
```

Restart Claude Code and invoke it as `/repo-learning-builder`.

## Use

```
/repo-learning-builder https://github.com/owner/repo
/repo-learning-builder teach me DNS
/repo-learning-builder teach me authentication from this project
/repo-learning-builder create a lesson about src/auth/session.ts
```

It inspects the source, asks one compact questionnaire (learner level, goal, depth, style, with a "use recommended defaults" shortcut), then generates the course and adds it to the app. It never rebuilds the application during normal use.

## One app, many courses

```
learning-app/
├── src/                     # permanent Atlas template (never edited to add a course)
├── public/courses/
│   ├── index.json           # generated course registry
│   ├── claimfarm/course.json
│   └── dns/course.json
├── package.json             # permanent
└── package-lock.json        # permanent
```

Adding a second course changes only files under `public/courses/`. Run the generated app with standard commands:

```bash
cd learning-app
npm install      # once
npm run dev      # http://localhost:5173
npm run test     # unit + interaction tests
npm run build    # static build in dist/
```

## How it stays fast and truthful

Generation is a token-efficient, deterministic-first pipeline (see `references/` and `scripts/`):

1. **Fingerprint** the source (`scripts/fingerprint-source.mjs`); reuse cached analysis when it matches.
2. **Analyze** into a compact `source-manifest.json` (`scripts/analyze-source.mjs`); never dump whole files or secrets.
3. **Scaffold** stable course/module/lesson ids and archetypes (`scripts/create-course-scaffold.mjs`).
4. **Generate one lesson at a time** with the Haiku-friendly prompts in `prompts/`.
5. **Validate** each lesson and **repair field-by-field** (`scripts/validate-lesson.mjs`, `prompts/repair-json.md`).
6. **Assemble** and **register** the course (`scripts/assemble-course.mjs`, `scripts/register-course.mjs`).

Every repository claim cites a real file. Inferences are labeled. Progress migrates by stable lesson and concept ids across regenerations.

## What's in here

```
SKILL.md                     # concise, procedural entry point
prompts/                     # plan-course, generate-lesson, generate-quiz, generate-glossary, repair-json
references/                  # course-schema, teaching-rules, source-analysis
scripts/                     # analyze-source, fingerprint-source, create-course-scaffold,
                             # validate-lesson, assemble-course, register-course, install-template
assets/webapp-template/      # the permanent Atlas React + TS + Vite app (ships a demo course)
```

Try the app immediately: `cd assets/webapp-template && npm install && npm run dev`.

## License

MIT. See [LICENSE](LICENSE).
