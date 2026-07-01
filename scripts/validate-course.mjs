#!/usr/bin/env node
// Validate a compact v2 course.json (see references/curriculum-schema.md).
// Usage: node validate-course.mjs <course.json>
// Exit 0 = valid, 1 = invalid. Mirrors src/lib/schema.ts validateCourse.

import { readFileSync } from 'node:fs';

const ARCHETYPES = new Set([
  'concept', 'story', 'architecture', 'code-walkthrough', 'request-flow',
  'technology', 'exercise', 'debugging', 'comparison', 'final-project', 'teach-back',
]);

export function validateCourse(course) {
  const errors = [];
  const warnings = [];
  const seen = new Map();
  const requireId = (id, kind, where) => {
    if (id == null || id === '') { errors.push(`${where}: missing id`); return; }
    if (seen.has(id)) errors.push(`duplicate id "${id}" (${kind} and ${seen.get(id)})`);
    else seen.set(id, kind);
  };

  if (!course || typeof course !== 'object') return { ok: false, errors: ['course is not an object'], warnings };
  if (course.schemaVersion !== 2) errors.push('schemaVersion must be 2');

  const meta = course.meta;
  if (!meta || typeof meta !== 'object') errors.push('meta is required');
  else {
    for (const k of ['id', 'title', 'sourceType', 'generatedAt']) if (!meta[k]) errors.push(`meta.${k} is required`);
    if (!Array.isArray(meta.levels) || meta.levels.length === 0) errors.push('meta.levels must be a non-empty array');
    else if (meta.defaultLevel && !meta.levels.includes(meta.defaultLevel)) errors.push(`meta.defaultLevel "${meta.defaultLevel}" not in levels`);
  }
  const defaultLevel = meta?.defaultLevel || meta?.levels?.[0];

  const reg = course.registries ?? {};
  const sourceIds = new Set(Object.keys(reg.sources ?? {}));
  const techIds = new Set(Object.keys(reg.tech ?? {}));
  const conceptIds = new Set(Object.keys(reg.concepts ?? {}));
  const diagramIds = new Set(Object.keys(reg.diagrams ?? {}));
  for (const id of [...sourceIds, ...techIds, ...conceptIds, ...diagramIds]) requireId(id, 'registry', `registries.${id}`);

  if (!Array.isArray(course.modules) || course.modules.length === 0) {
    errors.push('modules must be a non-empty array');
  } else {
    course.modules.forEach((mod, mi) => {
      const mw = `modules[${mi}]`;
      requireId(mod?.id, 'module', mw);
      if (!mod?.title) errors.push(`${mw}: missing title`);
      if (!Array.isArray(mod?.lessons) || mod.lessons.length === 0) { errors.push(`${mw}: lessons must be non-empty`); return; }
      mod.lessons.forEach((lesson, li) => {
        const lw = `${mw}.lessons[${li}]`;
        requireId(lesson?.id, 'lesson', lw);
        if (!lesson?.title) errors.push(`${lw}: missing title`);
        if (!lesson?.archetype || !ARCHETYPES.has(lesson.archetype)) errors.push(`${lw}: invalid archetype "${lesson?.archetype}"`);
        const hasText = lesson?.levels && Object.keys(lesson.levels).length > 0;
        const hasFacets = lesson?.facets && Object.keys(lesson.facets).length > 0;
        if (!hasText && !hasFacets && !lesson?.walkthrough && !lesson?.flow && !lesson?.compare)
          warnings.push(`${lw}: no explanation text, facets, walkthrough, flow, or comparison`);
        if (hasText && defaultLevel && !lesson.levels[defaultLevel]) warnings.push(`${lw}: levels present but missing default level "${defaultLevel}"`);
        for (const sid of lesson?.sources ?? []) if (!sourceIds.has(sid)) warnings.push(`${lw}: source "${sid}" not in registries.sources`);
        for (const tid of lesson?.tech ?? []) if (!techIds.has(tid)) warnings.push(`${lw}: tech "${tid}" not in registries.tech`);
        for (const cid of lesson?.concepts ?? []) if (!conceptIds.has(cid)) warnings.push(`${lw}: concept "${cid}" not in registries.concepts`);
        if (lesson?.diagram && !diagramIds.has(lesson.diagram)) warnings.push(`${lw}: diagram "${lesson.diagram}" not in registries.diagrams`);
        if (lesson?.quiz != null) {
          if (!Array.isArray(lesson.quiz)) errors.push(`${lw}.quiz must be an array`);
          else lesson.quiz.forEach((q, qi) => {
            const qw = `${lw}.quiz[${qi}]`;
            requireId(q?.id, 'quiz', qw);
            if (!q?.q) errors.push(`${qw}: missing question text (q)`);
            if (!Array.isArray(q?.options) || q.options.length < 2) errors.push(`${qw}: options must have >= 2 entries`);
            else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) errors.push(`${qw}: answer out of range`);
            if (!q?.why) warnings.push(`${qw}: missing explanation (why)`);
          });
        }
      });
    });
  }
  return { ok: errors.length === 0, errors, warnings };
}

function main() {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node validate-course.mjs <course.json>'); process.exit(1); }
  let course;
  try { course = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { console.error(`Failed to read/parse ${file}: ${e.message}`); process.exit(1); }
  const { ok, errors, warnings } = validateCourse(course);
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (!ok) {
    for (const e of errors) console.error(`error: ${e}`);
    console.error(`\nINVALID: ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`VALID: 0 errors, ${warnings.length} warning(s).`);
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
