# Source Analysis

Goal: build an accurate mental model of the source so lessons are truthful and
specific. Separate **verified facts** (you read it) from **inferences** (you
reasoned it). Cite exact file paths. Never invent behavior. Never print secrets.

## Pick the source

| Input | First moves |
| --- | --- |
| Current repository | Run `scripts/analyze-repository.mjs <path>`, then read the files it flags. |
| GitHub URL | Clone shallow (`git clone --depth 1`) or fetch via the GitHub API; then treat as a repository. |
| Topic | Skip file analysis; go to "Topic decomposition" below. |
| Current session/project | Reconstruct from the conversation and on-disk files; verify claims against files. |
| Documents/notes | Read provided files; extract structure, claims, examples. |

## Repository analysis checklist

Read, in roughly this order, whatever exists:

1. **Orientation**: `README*`, `docs/`, `CONTRIBUTING*`, `LICENSE`, top-level
   comments. What does the project claim to be?
2. **Manifests / deps**: `package.json`, `requirements.txt`, `pyproject.toml`,
   `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`.
   Detect language(s), frameworks, libraries, package manager, scripts.
3. **Config & environment**: `.env.example` (never `.env`), `config/`,
   `*.config.*`, `tsconfig`, linters. Detect external services and settings.
   Do not read or display secret values.
4. **Entry points**: `main`, `index`, `app`, `cmd/`, `src/`, server bootstrap,
   CLI definitions, route registration. Where does execution begin?
5. **Source layout**: map major directories and their roles.
6. **Data layer**: schemas, migrations, ORM models, SQL, fixtures. What is
   stored and how is it shaped?
7. **API / interface**: routes, controllers, GraphQL schema, RPC, CLI commands,
   UI entry components.
8. **Tests**: what is covered; tests double as executable documentation.
9. **Build & deploy**: `Dockerfile`, CI workflows, `Makefile`, infra-as-code.
10. **History** (if available): `git log --oneline -20`, notable churn.

## What to extract

- **Tech inventory**: languages, frameworks, libraries, storage, auth, testing
  tools, package managers, external services, infra.
- **Entry points and runtime flow**: from process start to ready state.
- **User journeys**: trace 1-3 important flows from UI/API entry through
  business logic to data and back. These become the "complete journey" module.
- **Repo map**: a tree of major dirs/files with a one-line role for each. Feeds
  the `repoMap` field and the file-explorer UI.
- **Why decisions**: infer why a stack/pattern was chosen; clearly label as
  inference unless docs state it.
- **Tradeoffs and limitations**: gaps, TODOs, scaling limits, coupling.

## Fact vs inference

Tag each non-trivial claim mentally as fact (cite path[:lines]) or inference.
In lessons, write inferences with hedging ("likely", "appears to") and keep
verified facts crisp with a source citation. Source citations go in each
lesson's `sources[]`.

## Topic decomposition (non-code or no repo)

Break the topic into: prerequisites, fundamental ideas, mental models, practical
uses, worked examples, exercises, advanced extensions. Distinguish established
facts, deliberate simplifications, and optional depth. Cite reputable sources by
name where it matters; do not fabricate citations.

## Session / memory reconstruction

Reconstruct what was built and why from the conversation and recalled memory.
Verify against files whenever possible. If something cannot be verified, say so
plainly rather than pretending to remember it.

## Category (selects the theme)

Classify the source into one `meta.category`, which deterministically picks a
theme (see `design-system.md`): `web-app`, `frontend`, `mobile`, `cli`,
`library`, `devops`, `infra`, `backend`, `api`, `data`, `ai-ml`, `topic`,
`docs`. Infer it from the primary language, frameworks, and entry points that
`scripts/analyze-repository.mjs` reports. When unsure, prefer the closest fit;
an unknown value safely falls back to Storybook.

## Fingerprint, caching, and budgets

- Run the analysis once. Compute a fingerprint with
  `scripts/fingerprint-source.mjs` (git SHA preferred, else a hash of the file
  listing) and store it in `meta.sourceFingerprint`.
- Reuse the single analysis for the whole generation. If re-invoked on the same
  fingerprint, reuse the existing course; if it changed, plan an incremental
  regeneration (`scripts/plan-regeneration.mjs`).
- Size the course to the chosen depth budget (quick 3-5, standard 6-12, deep
  12-24 lessons). Generate what the source justifies; never pad to a count.

## Safety

- Never read, echo, or embed secrets, tokens, or private env values.
- Use `.env.example` for shape, never `.env`.
- Redact anything that looks like a credential before it reaches course content.
