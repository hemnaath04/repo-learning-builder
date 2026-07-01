#!/usr/bin/env node
// Plan an incremental regeneration by diffing two compact courses. Stable lesson
// and concept ids that survive keep their learner progress; the rest are added
// or dropped. Mirrors src/lib/regen.ts planRegeneration.
// Usage: node plan-regeneration.mjs <old-course.json> <new-course.json>

import { readFileSync } from 'node:fs';

const lessonIds = (c) => new Set((c.modules ?? []).flatMap((m) => (m.lessons ?? []).map((l) => l.id)));
const conceptIds = (c) => new Set(Object.keys(c.registries?.concepts ?? {}));

function main() {
  const [oldFile, newFile] = process.argv.slice(2);
  if (!oldFile || !newFile) { console.error('Usage: node plan-regeneration.mjs <old.json> <new.json>'); process.exit(1); }
  const prev = JSON.parse(readFileSync(oldFile, 'utf8'));
  const next = JSON.parse(readFileSync(newFile, 'utf8'));

  const pL = lessonIds(prev), nL = lessonIds(next);
  const kept = [...nL].filter((id) => pL.has(id));
  const added = [...nL].filter((id) => !pL.has(id));
  const removed = [...pL].filter((id) => !nL.has(id));
  const fingerprintChanged = (prev.meta?.sourceFingerprint ?? '') !== (next.meta?.sourceFingerprint ?? '');

  const pC = conceptIds(prev), nC = conceptIds(next);
  const plan = {
    fingerprintChanged,
    unchanged: !fingerprintChanged && added.length === 0 && removed.length === 0,
    keptLessons: kept, addedLessons: added, removedLessons: removed,
    keptConcepts: [...nC].filter((id) => pC.has(id)),
    removedConcepts: [...pC].filter((id) => !nC.has(id)),
    guidance: added.length || removed.length
      ? `Regenerate ${added.length} added lesson(s); ${kept.length} keep progress; ${removed.length} dropped.`
      : 'No structural change; regeneration can reuse existing lesson data.',
  };
  process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
}

main();
