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

`example`, `analogy`, `insight`, `warning`. Use sparingly and only when they aid
understanding. Analogies must map accurately to the real behavior.

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
