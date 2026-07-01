# Generate glossary (one output: a glossary map)

Write glossary entries for the terms used across the course. Return JSON only.

RULES
- Only include terms that actually appear in the course content.
- Define each term in one plain sentence a beginner understands.
- Introduce the idea, do not just restate the word.
- Definition <= 24 words. No examples, no markdown.

OUTPUT SHAPE (JSON): a map of glossary id -> entry
{
  "g-<slug>": { "term": "Webhook", "definition": "A URL a service calls when something happens, like an inbound message." }
}

Return only the JSON object.
