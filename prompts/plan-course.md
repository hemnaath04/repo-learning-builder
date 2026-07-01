# Plan course (one output: course meta + registries + scaffold titles)

You plan a course. Return JSON only. No prose.

INPUTS (provided): learner preferences, source-manifest.json, the scaffold (module and lesson ids + archetypes).

RULES
- Use only the manifest. Never invent files, frameworks, or behavior.
- Fill titles and summaries for every scaffold module and lesson. Do not add or remove ids.
- Write concept, technology, source, and glossary registry entries the lessons will reference.
- Keep lesson count within the depth budget already in the scaffold. No filler.
- Titles <= 6 words. Summaries <= 20 words. Registry summaries <= 16 words.

OUTPUT SHAPE (JSON)
{
  "meta": { "title": "...", "subtitle": "...", "promise": "one line", "category": "...", "outcomes": ["...","..."] },
  "registries": {
    "concepts": { "c-x": { "name": "...", "summary": "..." } },
    "technologies": { "t-x": { "name": "...", "purpose": "...", "location": "path", "alternatives": "...", "tradeoffs": "..." } },
    "sources": { "s-x": { "path": "real/path.ts", "lines": "1-40", "note": "..." } },
    "glossary": { "g-x": { "term": "...", "definition": "one plain sentence" } }
  },
  "modules": [ { "id": "m-story", "title": "...", "summary": "...", "lessons": [ { "id": "l-story", "title": "...", "summary": "..." } ] } ]
}

Every source path must exist in the manifest. Return only the JSON object.
