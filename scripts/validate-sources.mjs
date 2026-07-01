#!/usr/bin/env node
// Verify every source reference in a compact course points at a real file in the
// repository. Enforces the rule: every repository claim must cite a real file.
// Usage: node validate-sources.mjs <course.json> <repoPath>

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function collectPaths(course) {
  const paths = new Set();
  const sources = course.registries?.sources ?? {};
  for (const s of Object.values(sources)) if (s?.path) paths.add(s.path);
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      // walkthrough steps reference source ids via `src`; those resolve to registry paths above.
      for (const step of lesson.walkthrough ?? []) {
        if (step.src && sources[step.src]?.path) paths.add(sources[step.src].path);
      }
    }
  }
  return [...paths];
}

function main() {
  const [file, repo] = process.argv.slice(2);
  if (!file || !repo) { console.error('Usage: node validate-sources.mjs <course.json> <repoPath>'); process.exit(1); }
  const course = JSON.parse(readFileSync(file, 'utf8'));
  const paths = collectPaths(course);
  const missing = paths.filter((p) => !existsSync(join(repo, p)));

  console.log(`Checked ${paths.length} cited path(s) against ${repo}`);
  if (missing.length) {
    for (const m of missing) console.error(`missing: ${m}`);
    console.error(`\nINVALID: ${missing.length} cited path(s) do not exist.`);
    process.exit(1);
  }
  console.log('VALID: every cited path exists.');
  process.exit(0);
}

main();
