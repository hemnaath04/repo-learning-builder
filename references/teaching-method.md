# Teaching Method

## Lesson archetypes (the token-saving core)

Every lesson has an `archetype`. The renderer uses it to supply the lesson kind
(quick/deep/challenge/project), an icon, a badge label, and the four facet
labels. Generated data carries only source-specific content, never these
structural strings.

| Archetype | Kind | Use it for |
| --- | --- | --- |
| `story` | quick | The narrative that frames the whole thing |
| `concept` | quick | A single idea made clear |
| `technology` | quick | One tool and why it was chosen (add `tech` ids) |
| `comparison` | quick | Weighing options (add `compare`) |
| `architecture` | deep | How parts connect (add a `diagram`) |
| `code-walkthrough` | deep | Reading real code (add `walkthrough` with highlights) |
| `request-flow` | deep | One action end to end (add `flow` steps) |
| `exercise` | challenge | Do it yourself (add `exercise`) |
| `debugging` | challenge | Find, understand, fix a problem |
| `final-project` | project | Put it all together |
| `teach-back` | project | Prove you can explain it |

Adapt the module arc to the source. A typical standard course: story, problem,
what-it-does, toolbox, architecture, one request-flow, agents/components,
data+state, run/test/deploy, tradeoffs, teach-back. Do not mechanically emit
every archetype.

## The facet switcher (What / Why / How / What if)

Instead of a long definition list, put the four answers in `facets` and the
renderer shows them as tabs with archetype-specific labels. Fill the ones that
add value; omit the rest. Do not write the labels into the data.

## Callouts

Short, high-signal blocks, each rendered with its own icon and color. Use them
sparingly and only when they aid understanding:

- `example` a concrete instance
- `analogy` an accurate real-world mapping (must map to the real behavior)
- `insight` the non-obvious takeaway
- `warning` a limitation, footgun, or "watch out"
- `experiment` something the learner can try

## Lesson anatomy

A lesson may include (all optional except title + archetype): explanations at up
to four levels (`eli10`, `beginner`, `intermediate`, `advanced`); facets;
diagram; flow; walkthrough; tech cards; comparison; callouts; contextual source
references; a quiz with hints and per-answer explanations; a hands-on exercise;
a teach-back prompt; a recap; and optional go-deeper. The renderer adds a sticky
progress bar, a contextual table of contents, a recap card, and keyboard
navigation.

## Writing rules

- Introduce every term before using it; add it to the glossary registry.
- `eli10` must be understandable by a motivated 10-year-old, never patronizing.
- Short sentences, concrete examples, no walls of text. Lean on facets, callouts,
  diagrams, and disclosure.
- Quiz explanations (`why`) teach regardless of the answer and never shame a
  wrong choice. Provide a `hint` for a nudge before the answer.
- Weight content to the chosen style: visual (more diagrams), story (more
  analogy), hands-on (more exercises), code-first (more walkthroughs), balanced.
- No em dashes. No motivational filler. Every visual must earn its place.

## Diagrams

Prefer Mermaid (`flowchart`, `sequenceDiagram`, `erDiagram`, `classDiagram`).
One idea per diagram. Store in `registries.diagrams` and reference by id. An
architecture/system diagram also powers the repository explorer's map.
