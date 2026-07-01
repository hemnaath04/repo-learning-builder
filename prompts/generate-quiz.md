# Generate knowledge checks (one output: a checks map)

Write knowledge checks for one lesson. Return JSON only.

RULES
- Base every question on the supplied lesson content only. Never invent behavior.
- 1 check for quick, 2 for standard, 2-3 for deep.
- Exactly one correct option. 3-4 plausible options. No trick questions.
- `answer` is the 0-based index of the correct option.
- `hint` nudges without giving the answer. `why` teaches, one sentence.
- Question <= 20 words. Options <= 12 words.

OUTPUT SHAPE (JSON): a map of check id -> check
{
  "chk-<lessonid>-1": { "q": "...", "options": ["...","...","..."], "answer": 0, "hint": "...", "why": "..." }
}

EXAMPLE
{"chk-flow-1":{"q":"Where are fraud flags computed?","options":["In the webhook","At review time in get_claim","Nightly"],"answer":1,"hint":"Who needs them?","why":"Deferring keeps the farmer reply fast."}}

Return only the JSON object.
