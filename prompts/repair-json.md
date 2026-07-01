# Repair JSON (one output: the corrected JSON)

The previous JSON failed validation. Fix ONLY the listed fields. Return JSON only.

RULES
- Return the full corrected object, valid JSON, no prose, no fences.
- Change only the fields named in the errors. Leave everything else exactly as is.
- Do not invent files, ids, or behavior. Use only ids that were allowed.
- Keep within the same word budget.

INPUTS (provided): the invalid JSON, and an errors array like:
[ { "field": "sections", "message": "lesson has no sections, summary, walkthrough, flow, or comparison" },
  { "field": "checks", "message": "check \"chk-x\" not in checks registry" } ]

Fix each field:
- missing section/summary -> add the smallest valid content.
- unknown/invalid id -> remove it or replace with an allowed id.
- invalid archetype -> use the closest valid archetype from the allowed list.
- answer out of range -> set to the correct 0-based index.

Return only the corrected JSON object.
