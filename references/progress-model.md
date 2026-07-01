# Progress and Mastery Model

Progress persists independently of any Claude conversation. Default storage is
the browser (`localStorage` by default; IndexedDB is fine for larger data). It
is keyed by `courseId` so multiple courses coexist. The shape below matches
`src/lib/progress.ts` and `src/lib/mastery.ts` in the web-app template.

## Stored shape (v1)

```jsonc
{
  "version": 1,
  "courseId": "course-id",
  "sourceFingerprint": "matches meta.sourceFingerprint at generation time",
  "preferences": {
    "explanationLevel": "eli10|beginner|intermediate|advanced",
    "theme": "light|dark|system",
    "themeName": "auto|explorer|laboratory|storybook|blueprint",
    "teachingStyle": "story|visual|code-first|hands-on|balanced",
    "reducedChrome": false
  },
  "currentLessonId": "l-...",          // resume target
  "lessons": {
    "l-...": { "opened": true, "completed": false,
               "openedAt": "ISO", "completedAt": null }
  },
  "quizAttempts": {
    "q-...": [ { "selected": 1, "correct": false, "at": "ISO" } ]
  },
  "exercises": { "ex-...": { "done": true, "notes": "" } },
  "teachBack": { "l-...": "learner's own-words answer" },
  "notes": { "l-...": "free text" },
  "bookmarks": ["l-..."],
  "mastery": { "concept-id": 0.0 },     // 0..1, derived (see below)
  "review": {                            // spaced repetition per concept
    "concept-id": { "due": "ISO", "intervalDays": 1, "ease": 2.5, "streak": 0 }
  },
  "updatedAt": "ISO"
}
```

## Mastery estimation

A lesson is **not** mastered just because it was opened. Mastery is per concept,
in `[0, 1]`, aggregated from evidence across all lessons tagged with that
concept:

- **Quiz performance** (primary): accuracy over attempts, weighting recent
  attempts more. First-try correct counts most. Repeated mistakes lower the
  score.
- **Exercises**: completed hands-on challenges add evidence.
- **Teach-back**: a non-trivial own-words answer adds evidence (length and
  presence based in the template; can be upgraded to LLM scoring).
- **Application**: successful use of the concept in a later exercise/quiz.

Reference weighting used by the template (`computeConceptMastery`):

```
quizScore     -> 0.60   // recency-weighted accuracy, first-try bonus
exerciseScore -> 0.25   // fraction of related exercises completed
teachBack     -> 0.15   // presence + minimal substance of teach-back
```

A concept counts as "mastered" at `mastery >= 0.8`. "Needs review" at
`mastery < 0.5` with at least one attempt.

## Spaced repetition (lightweight)

For each concept the learner struggles with, schedule a review with an SM-2
inspired update (`scheduleReview`):

- On success: `streak += 1`, `intervalDays = max(1, round(intervalDays * ease))`,
  `ease = min(2.8, ease + 0.1)`.
- On failure: `streak = 0`, `intervalDays = 1`, `ease = max(1.3, ease - 0.2)`.
- `due = now + intervalDays`.

The dashboard surfaces concepts whose `due <= now` as "review today".

## Reset, export, import

- **Export**: serialize the whole progress object to a downloadable JSON file.
- **Import**: validate `version` and `courseId`, then replace state.
- **Reset**: clear the course's stored key after confirmation.

## Regeneration

When the course is regenerated, keep progress for lessons/concepts whose `id`
still exists. Drop entries whose ids are gone. Record the new `sourceFingerprint`.
See `generation-workflow.md` and `scripts/plan-regeneration.mjs`.
