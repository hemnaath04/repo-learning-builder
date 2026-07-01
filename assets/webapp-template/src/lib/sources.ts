// Source-reference collection and validation. Every repository claim must cite
// a real file; this powers scripts/validate-sources.mjs and the tests.

import type { Course, SourceRef } from './schema';

export function collectSourceRefs(course: Course): SourceRef[] {
  const refs: SourceRef[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      for (const s of lesson.sources ?? []) refs.push(s);
      for (const w of lesson.walkthrough ?? []) if (w.path) refs.push({ path: w.path, lines: w.lines });
    }
  }
  return refs;
}

export interface SourceCheck {
  ok: boolean;
  missing: string[]; // paths that do not exist in the source
  checked: number;
}

/** Verify every cited path exists in the provided set of real source paths. */
export function validateSourceRefs(course: Course, existingPaths: Iterable<string>): SourceCheck {
  const have = new Set(existingPaths);
  const refs = collectSourceRefs(course);
  const missing = [...new Set(refs.map((r) => r.path).filter((p) => !have.has(p)))];
  return { ok: missing.length === 0, missing, checked: refs.length };
}
