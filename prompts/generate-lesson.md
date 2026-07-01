# Generate one lesson (one output: a single lesson JSON)

Write ONE lesson. Return JSON only. No prose, no markdown fences.

RULES
- Use only the supplied evidence (manifest + excerpts + registry ids). Never invent files, values, or behavior. Cite only given source ids.
- Introduce a term before using it. Write for the learner level. Short, concrete sentences. No filler.
- Fill the five sections (1-3 short sentences each). Stay in the depth word budget (quick 250-400, standard 400-650, deep 600-900).
- Every lesson must SHOW one concrete instance: "example" with real values, "worked", "scenario", or a walkthrough. Never only describe.
- Include one accurate "analogy" plus "analogyPairs" (story part -> system part), and one "activity" doable in under 5 minutes.
- "worked" = ONE real input traced in 4-8 steps; each step "state" holds the actual data (real field and function names). Use on flow/architecture/code lessons; one per module.
- "scenario" = 2-4 alternative inputs and what the system truly does, from real branches (include one failure branch).
- "predict" = one question (3-4 options) answered before the mechanism; "reveal" states the answer and why. One per module.
- "misconception" = a plausible wrong belief, corrected in one breath.
- Deep courses: ground everything in the given code; code-walkthrough lessons carry short real snippets with exact source ids. Teach the code, not the README.

INPUTS (provided): lesson scaffold (id, type, title, features), learner level, source excerpts, allowed registry ids, allowed check ids.

OUTPUT SHAPE (JSON), only fields that apply:
{"id":"<given>","type":"<given>","title":"...","summary":"one-line hook",
"conceptIds":[],"sourceIds":[],"techIds":[],
"sections":{"what":"","why":"","how":"","connects":"","ifChanged":""},
"example":"concrete instance with real values","analogy":"...",
"analogyPairs":[{"from":"story part","to":"system part"}],
"misconception":"wrong belief, then correction",
"predict":{"question":"","options":["","",""],"reveal":"answer and why"},
"worked":{"intro":"the one real input","steps":[{"label":"","detail":"","state":[{"k":"field","v":"value"}]}],"outcome":"where it ends up"},
"scenario":{"prompt":"","choices":[{"label":"input","steps":[""],"outcome":""}]},
"activity":"one thing to do","checks":["chk-x"],"teachBack":"one prompt"}

EXAMPLE (valid, abbreviated)
{"id":"l-flow","type":"request-flow","title":"From photo to claim","summary":"Follow one request end to end.","sourceIds":["s-intake"],"sections":{"what":"The path an inbound photo takes.","why":"So you can trace each step.","how":"A webhook triggers ordered steps ending in a saved claim.","connects":"Each step maps to one agent file.","ifChanged":"Reordering breaks later inputs."},"predict":{"question":"Text arrives with no photo?","options":["Claim filed","Reply asks for a photo","Crash"],"reveal":"It returns awaiting_photo; no claim is created."},"worked":{"intro":"One flood photo arrives.","steps":[{"label":"Webhook fires","state":[{"k":"media_url","v":"https://...jpg"}]},{"label":"Damage assessed","state":[{"k":"severity","v":"72"}]}],"outcome":"A pending claim with a PDF."},"activity":"List process_inbound's calls in order.","checks":["chk-defer"],"teachBack":"Explain the flow."}

Return only the JSON object.
