# Generate one lesson (one output: a single lesson JSON)

Write ONE lesson. Return JSON only. No prose, no markdown fences.

RULES
- Use only the supplied evidence (manifest + excerpts + registry ids). Never invent files or behavior.
- Introduce a technical term before using it.
- Write for the selected learner level. Short, concrete sentences. No filler.
- Include one accurate analogy and one practical activity.
- Cite source ids you were given (do not invent ids).
- Stay within the word budget for this depth (quick 250-400, standard 400-650, deep 600-900).
- Fill the five sections. Keep each section 1-3 short sentences.
- For deep courses, ground the lesson in the real code you were given: name real
  functions, classes, and files; when the archetype is code-walkthrough, include
  short real snippets with the exact source ids. Never teach only what the README
  says; teach how the code actually works.

INPUTS (provided): lesson scaffold (id, type, title), learner level, relevant source excerpts, allowed registry ids (concepts, sources, technologies), allowed check ids (may be empty).

OUTPUT SHAPE (JSON) — include only fields that apply to the archetype
{
  "id": "<given id>",
  "type": "<given type>",
  "title": "<given or improved title>",
  "summary": "one sentence hook",
  "conceptIds": ["c-x"],
  "sourceIds": ["s-x"],
  "techIds": ["t-x"],
  "sections": { "what": "...", "why": "...", "how": "...", "connects": "...", "ifChanged": "..." },
  "example": "one concrete instance",
  "analogy": "one accurate analogy",
  "activity": "one thing the learner can do",
  "checks": ["chk-x"],
  "teachBack": "one prompt"
}

EXAMPLE (valid)
{"id":"l-flow","type":"request-flow","title":"From photo to claim","summary":"Follow one request end to end.","conceptIds":["webhook"],"sourceIds":["s-intake"],"sections":{"what":"The path an inbound photo takes.","why":"So you can trace where each step happens.","how":"A webhook triggers ordered steps that end in a saved claim.","connects":"Each step maps to one agent file.","ifChanged":"Reordering steps breaks later inputs."},"example":"A flood photo becomes a pending claim in seconds.","analogy":"An assembly line: each station does one job.","activity":"List the calls process_inbound makes, in order.","checks":["chk-defer"],"teachBack":"Explain the flow in your own words."}

Return only the JSON object.
