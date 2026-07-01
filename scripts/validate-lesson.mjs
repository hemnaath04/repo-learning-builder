#!/usr/bin/env node
// Validate a single lesson (default) or a whole compact course (--course).
// Emits field-level errors so the repair prompt can fix only what is broken.
// Usage:
//   node validate-lesson.mjs lesson.json                 -> { ok, errors:[{field,message}] }
//   node validate-lesson.mjs course.json --course        -> whole-course validation
// Exit 0 = valid, 1 = invalid.

import { readFileSync } from 'node:fs';

const ARCHETYPES = new Set(['overview', 'story', 'concept', 'technology', 'architecture', 'request-flow', 'code-walkthrough', 'comparison', 'debugging', 'exercise', 'customization', 'final-project', 'teach-back']);
const SECTIONS = ['what', 'why', 'how', 'connects', 'ifChanged'];

export function validateLesson(l, ctx = {}) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  if (!l || typeof l !== 'object') return [{ field: '.', message: 'lesson is not an object' }];
  if (!l.id) add('id', 'missing id');
  if (!l.title) add('title', 'missing title');
  if (!l.type || !ARCHETYPES.has(l.type)) add('type', `invalid archetype "${l.type}"`);
  const hasBody = (l.sections && Object.keys(l.sections).length) || l.summary || l.walkthrough || l.flow || l.compare;
  if (!hasBody) add('sections', 'lesson has no sections, summary, walkthrough, flow, or comparison');
  if (l.sections) for (const k of Object.keys(l.sections)) if (!SECTIONS.includes(k)) add(`sections.${k}`, `unknown section key (allowed: ${SECTIONS.join(', ')})`);
  // Referential checks only when registry context is supplied (whole-course pass).
  if (ctx.conceptIds) for (const id of l.conceptIds ?? []) if (!ctx.conceptIds.has(id)) add('conceptIds', `concept "${id}" not in registry`);
  if (ctx.sourceIds) for (const id of l.sourceIds ?? []) if (!ctx.sourceIds.has(id)) add('sourceIds', `source "${id}" not in registry`);
  if (ctx.checkIds) for (const id of l.checks ?? []) if (!ctx.checkIds.has(id)) add('checks', `check "${id}" not in checks registry`);
  return errors;
}

function validateCourse(c) {
  const errors = [];
  if (c.schemaVersion !== 3) errors.push({ field: 'schemaVersion', message: 'must be 3' });
  for (const k of ['id', 'title', 'sourceType', 'generatedAt']) if (!c.meta?.[k]) errors.push({ field: `meta.${k}`, message: 'required' });
  const reg = c.registries ?? {};
  const ctx = {
    conceptIds: new Set(Object.keys(reg.concepts ?? {})),
    sourceIds: new Set(Object.keys(reg.sources ?? {})),
    checkIds: new Set(Object.keys(c.checks ?? {})),
  };
  const ids = new Set();
  if (!Array.isArray(c.modules) || c.modules.length === 0) errors.push({ field: 'modules', message: 'must be non-empty' });
  for (const m of c.modules ?? []) {
    if (ids.has(m.id)) errors.push({ field: `module ${m.id}`, message: 'duplicate id' }); else ids.add(m.id);
    for (const l of m.lessons ?? []) {
      if (ids.has(l.id)) errors.push({ field: `lesson ${l.id}`, message: 'duplicate id' }); else ids.add(l.id);
      for (const e of validateLesson(l, ctx)) errors.push({ field: `${l.id}.${e.field}`, message: e.message });
    }
  }
  for (const [id, ch] of Object.entries(c.checks ?? {})) {
    if (!ch.q) errors.push({ field: `checks.${id}.q`, message: 'missing question' });
    if (!Array.isArray(ch.options) || ch.options.length < 2) errors.push({ field: `checks.${id}.options`, message: 'need >= 2 options' });
    else if (typeof ch.answer !== 'number' || ch.answer < 0 || ch.answer >= ch.options.length) errors.push({ field: `checks.${id}.answer`, message: 'answer out of range' });
  }
  return errors;
}

function main() {
  const file = process.argv[2];
  const course = process.argv.includes('--course');
  if (!file) { console.error('Usage: node validate-lesson.mjs <file.json> [--course]'); process.exit(1); }
  let data; try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`parse error: ${e.message}`); process.exit(1); }
  const errors = course || data.modules ? validateCourse(data) : validateLesson(data);
  const ok = errors.length === 0;
  console.log(JSON.stringify({ ok, errors }, null, 2));
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
