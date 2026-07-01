#!/usr/bin/env node
// Expand a compact course and report what the renderer will produce. Useful for
// sanity-checking generation and for confirming the compact -> runtime mapping
// without launching the app. Mirrors src/lib/expand.ts at a summary level.
// Usage: node expand-course.mjs <course.json>

import { readFileSync } from 'node:fs';

function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node expand-course.mjs <course.json>'); process.exit(1); }
  const c = JSON.parse(readFileSync(file, 'utf8'));
  const reg = c.registries ?? {};

  const lessons = (c.modules ?? []).flatMap((m) => m.lessons ?? []);
  const byArchetype = {};
  let quiz = 0, walkthroughs = 0, facets = 0, callouts = 0, flows = 0;
  const CALLOUT_KEYS = ['example', 'analogy', 'insight', 'warning', 'experiment'];
  for (const l of lessons) {
    byArchetype[l.archetype] = (byArchetype[l.archetype] ?? 0) + 1;
    quiz += (l.quiz ?? []).length;
    if (l.walkthrough) walkthroughs++;
    if (l.facets) facets += Object.keys(l.facets).length;
    if (l.flow) flows++;
    for (const k of CALLOUT_KEYS) if (l[k]) callouts++;
  }

  const summary = {
    course: c.meta?.id,
    schemaVersion: c.schemaVersion,
    modules: (c.modules ?? []).length,
    lessons: lessons.length,
    registries: {
      concepts: Object.keys(reg.concepts ?? {}).length,
      sources: Object.keys(reg.sources ?? {}).length,
      tech: Object.keys(reg.tech ?? {}).length,
      glossary: Object.keys(reg.glossary ?? {}).length,
      diagrams: Object.keys(reg.diagrams ?? {}).length,
    },
    lessonArchetypes: byArchetype,
    totals: { quizItems: quiz, walkthroughs, facetPanels: facets, callouts, flows },
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main();
