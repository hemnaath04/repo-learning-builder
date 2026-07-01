#!/usr/bin/env node
// Deterministically combine a scaffold + validated per-lesson JSON files into one
// course.json. No model involvement. Lesson files are matched by id into their
// scaffold slots; registries.json / checks.json / diagrams.json / meta.json (if
// present in the lessons dir) are merged in.
// Usage: node assemble-course.mjs --scaffold s.json --lessons <dir> --out course.json

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i !== -1 ? process.argv[i + 1] : def; }

function main() {
  const scaffoldPath = arg('scaffold'); const dir = arg('lessons'); const out = arg('out');
  if (!scaffoldPath || !dir) { console.error('Usage: assemble-course.mjs --scaffold s.json --lessons <dir> [--out course.json]'); process.exit(1); }
  const course = JSON.parse(readFileSync(scaffoldPath, 'utf8'));

  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  const lessonsById = new Map();
  for (const f of files) {
    const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const base = f.replace(/\.json$/, '');
    if (base === 'registries') course.registries = { ...course.registries, ...data };
    else if (base === 'checks') course.checks = { ...course.checks, ...data };
    else if (base === 'diagrams') course.diagrams = { ...course.diagrams, ...data };
    else if (base === 'meta') course.meta = { ...course.meta, ...data };
    else if (data && data.id) lessonsById.set(data.id, data);
  }

  let filled = 0;
  for (const m of course.modules ?? []) {
    m.lessons = (m.lessons ?? []).map((slot) => {
      const gen = lessonsById.get(slot.id);
      if (gen) { filled++; return { ...slot, ...gen }; }
      return slot;
    });
  }

  const json = JSON.stringify(course, null, 2);
  if (out) { writeFileSync(out, json + '\n'); console.log(`Assembled ${out}: filled ${filled} lesson(s).`); }
  else process.stdout.write(json + '\n');
}

main();
