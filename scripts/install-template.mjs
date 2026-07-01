#!/usr/bin/env node
// Copy the permanent application template into place ONCE. On repeat runs it does
// not overwrite application code (idempotent): it only ensures public/courses
// exists. Use --force to reinstall the template.
// Usage: node install-template.mjs --dest <dir> [--force]

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i !== -1 ? process.argv[i + 1] : def; }

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, '..', 'assets', 'webapp-template');
const EXCLUDE = new Set(['node_modules', 'dist', '.vite', '.DS_Store']);

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (EXCLUDE.has(name)) continue;
    const s = join(src, name); const d = join(dest, name);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else cpSync(s, d);
  }
}

function main() {
  const dest = arg('dest', join(process.cwd(), 'learning-app'));
  const force = process.argv.includes('--force');
  if (!existsSync(templateDir)) { console.error(`Template not found at ${templateDir}`); process.exit(1); }

  const appExists = existsSync(join(dest, 'src')) && existsSync(join(dest, 'package.json'));
  if (appExists && !force) {
    mkdirSync(join(dest, 'public', 'courses'), { recursive: true });
    console.log(`Template already installed at ${dest}. Left application code untouched (use --force to reinstall).`);
    console.log('Add courses under public/courses/ and register them; do not modify src/.');
    process.exit(0);
  }

  copyDir(templateDir, dest);
  mkdirSync(join(dest, 'public', 'courses'), { recursive: true });
  console.log(`Installed template to ${dest}. Next: npm install (once), add a course, register it, npm run dev.`);
}

main();
