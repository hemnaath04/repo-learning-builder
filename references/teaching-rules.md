# Teaching rules

## What the model does vs never does

Do: pick important concepts, explain verified behavior, write analogies,
exercises, quiz questions, and adapt difficulty.

Never: build React components, write CSS, choose dependencies, rewrite schemas,
copy the template by hand, invent source behavior, read every file, print
install steps every run, or regenerate valid unchanged lessons.

## The five questions (labels are supplied by the app)

Put values only in `sections`: `what`, `why`, `how`, `connects`, `ifChanged`.
The renderer shows "What is it? / Why does it exist? / How does it work? / What
connects to it? / What happens if it changes?".

## Callouts

`example`, `analogy`, `insight`, `warning`, `misconception`. Use sparingly and
only when they aid understanding. Analogies must map accurately to the real
behavior; when you write one, add `analogyPairs` mapping story parts to system
parts. A `misconception` names the wrong belief a learner plausibly holds and
corrects it immediately.

## Show, don't just tell (per lesson)

Every lesson needs at least one concrete anchor: an `example` with real values,
a `worked` trace, a `scenario`, or a `walkthrough`. The validator warns when a
lesson has none.

- `worked` (worked-example effect, the strongest tool for novices): trace ONE
  real input end to end in 4-8 steps; each step's `state` shows the actual data
  at that moment (real field names, realistic values, real function names for
  repo courses). Target: at least one `worked` per module for standard/deep.
- `scenario` (what-if exploration): 2-4 alternative inputs and what the system
  truly does with each, including the failure branch. Use the code's real
  branches (e.g. the missing-photo reply, the 403 on a bad signature), never
  invented ones. 1-3 per course.
- `predict` (generation effect): one short question the learner answers before
  the mechanism is revealed. Best on flow, architecture, and debugging lessons.
  The reveal must state the answer and why. Aim for one per module.
- `activity`: something the learner can actually do in under five minutes
  (run a command, trace a call, break a thing safely). Required for hands-on
  archetypes; the validator warns when missing.

## Voice

- Introduce every term before using it. Short, concrete sentences.
- `eli10` must be understandable by a motivated 10-year-old, never patronizing.
- Cite real source ids. Mark inferences as inferences. Never show secrets.
- No em dashes. No motivational filler. Every visual must earn its place.

## Depth budgets (do not pad to a count)

| Depth | Lessons | Words/lesson | Checks/lesson |
| --- | --- | --- | --- |
| Quick | 3-5 | 250-400 | 1 |
| Standard | 6-12 | 400-650 | 2 |
| Deep | 12-20 | 600-900 | 2-3 |

## Depth is real coverage, not longer basics

A deep course teaches the actual system: one lesson per real subsystem or
technology found by reading the whole codebase (see `source-analysis.md`), each
grounded in real code (functions, classes, files) with a `code-walkthrough`
carrying real snippets and exact source ids. Never ship a "deep" course that only
restates the README or covers a handful of surface concepts. If a contributor
would need to understand it to change the code, it deserves a lesson.

## Adapting

Learner level sets the writing depth of the generated content. Goal shifts
emphasis (big picture vs contribution vs interview). Style weights analogy,
diagrams, code, or exercises. Generate the number of lessons the source
justifies, no more.

## Per-lesson generation

Generate one lesson at a time using `prompts/generate-lesson.md`, given only that
lesson's scaffold, the learner level, the allowed registry ids, and the relevant
excerpts. Validate immediately; on failure, repair only the invalid fields with
`prompts/repair-json.md` (retry at most twice, then fall back to a minimal safe
lesson).
