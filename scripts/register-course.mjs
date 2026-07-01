#!/usr/bin/env node
// Add or update a course in public/courses/index.json. Adding a course only
// touches data: this script never edits application code.
// Usage: node register-course.mjs --app <learning-app> --course <course.json>

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i !== -1 ? process.argv[i + 1] : def; }

function main() {
  const app = arg('app', process.cwd());
  const coursePath = arg('course');
  if (!coursePath) { console.error('Usage: register-course.mjs --app <learning-app> --course <course.json>'); process.exit(1); }
  const course = JSON.parse(readFileSync(coursePath, 'utf8'));
  const m = course.meta || {};
  if (!m.id) { console.error('course.meta.id is required'); process.exit(1); }

  const lessons = (course.modules ?? []).reduce((n, mod) => n + (mod.lessons?.length ?? 0), 0);
  const summary = {
    id: m.id, title: m.title, subtitle: m.subtitle,
    category: m.category, estimatedMinutes: m.estimatedMinutes,
    modules: (course.modules ?? []).length, lessons,
    updatedAt: new Date().toISOString(),
  };

  const indexPath = join(app, 'public', 'courses', 'index.json');
  if (!existsSync(dirname(indexPath))) mkdirSync(dirname(indexPath), { recursive: true });
  let registry = { courses: [] };
  if (existsSync(indexPath)) { try { registry = JSON.parse(readFileSync(indexPath, 'utf8')); } catch { /* reset */ } }
  if (!Array.isArray(registry.courses)) registry.courses = [];

  const idx = registry.courses.findIndex((c) => c.id === m.id);
  if (idx === -1) registry.courses.push(summary); else registry.courses[idx] = summary;

  writeFileSync(indexPath, JSON.stringify(registry, null, 2) + '\n');
  console.log(`Registered "${m.id}" in ${indexPath} (${registry.courses.length} course(s)).`);
}

main();
