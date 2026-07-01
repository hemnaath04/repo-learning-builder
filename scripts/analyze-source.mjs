#!/usr/bin/env node
// Deterministic repository analysis -> source-manifest.json. Produces a compact,
// relevant summary the model can consume without reading whole files.
// Usage: node analyze-source.mjs <repoPath> [--out source-manifest.json]

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, extname, relative, basename } from 'node:path';

const IGNORE = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.venv', 'venv', '__pycache__', '.cache', 'target', 'vendor', '.idea', '.vscode', 'Pods', 'DerivedData', '.turbo']);
const EXT_LANG = { '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.py': 'Python', '.go': 'Go', '.rs': 'Rust', '.java': 'Java', '.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#', '.swift': 'Swift', '.c': 'C', '.cpp': 'C++', '.sql': 'SQL', '.css': 'CSS', '.vue': 'Vue', '.svelte': 'Svelte' };
const MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json', 'Package.swift', 'pubspec.yaml'];
const CONFIGS = ['Dockerfile', 'docker-compose.yml', 'tsconfig.json', 'vite.config.ts', 'next.config.js', '.env.example', 'vercel.json', 'prisma/schema.prisma'];
const ENTRIES = ['src/index.ts', 'src/index.tsx', 'src/main.ts', 'src/main.tsx', 'src/app.ts', 'index.js', 'main.py', 'app.py', 'manage.py', 'main.go', 'server.ts', 'server.js', 'app/main.py'];

const CATEGORY_HINTS = [
  { cat: 'ai-ml', re: /openai|dashscope|anthropic|langchain|transformers|llama|qwen|embedding|torch|tensorflow/i },
  { cat: 'backend', re: /fastapi|flask|django|express|nestjs|fastify|gin|spring/i },
  { cat: 'web-app', re: /react|next|vue|svelte|angular|remix|astro/i },
  { cat: 'mobile', re: /swiftui|react-native|flutter|kotlin|jetpack/i },
  { cat: 'cli', re: /commander|clap|cobra|argparse|yargs/i },
  { cat: 'data', re: /pandas|numpy|spark|airflow|dbt|duckdb/i },
];

function gitSha(root) { try { return execSync('git rev-parse HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } }
function safeRead(p) { try { return readFileSync(p, 'utf8'); } catch { return null; } }

function walk(root) {
  const langBytes = {}; const files = []; let count = 0;
  function build(dir, depth) {
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const node = { name: basename(dir) || '.', kind: 'dir', path: relative(root, dir) || '.', children: [] };
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue;
      if (e.name.startsWith('.') && e.name !== '.env.example') continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < 2) { const c = build(p, depth + 1); if (c) node.children.push(c); }
        else countDeep(p);
      } else if (e.isFile()) {
        count++; files.push(relative(root, p));
        const ext = extname(e.name).toLowerCase();
        if (EXT_LANG[ext]) { try { langBytes[EXT_LANG[ext]] = (langBytes[EXT_LANG[ext]] || 0) + statSync(p).size; } catch { /* skip */ } }
        if (depth <= 2) node.children.push({ name: e.name, kind: 'file', path: relative(root, p) });
      }
    }
    return node;
  }
  function countDeep(dir) {
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) countDeep(p);
      else if (e.isFile()) { count++; files.push(relative(root, p)); const ext = extname(e.name).toLowerCase(); if (EXT_LANG[ext]) { try { langBytes[EXT_LANG[ext]] = (langBytes[EXT_LANG[ext]] || 0) + statSync(p).size; } catch { /* skip */ } } }
    }
  }
  return { tree: build(root, 0), langBytes, files, count };
}

function readmeSections(root) {
  const p = ['README.md', 'readme.md', 'README.rst'].map((f) => join(root, f)).find(existsSync);
  if (!p) return [];
  const text = safeRead(p) || '';
  return text.split('\n').filter((l) => /^#{1,3}\s/.test(l)).map((l) => l.replace(/^#+\s/, '').trim()).slice(0, 20);
}

function main() {
  const root = process.argv[2] || process.cwd();
  const outIdx = process.argv.indexOf('--out');
  const out = outIdx !== -1 ? process.argv[outIdx + 1] : null;
  if (!existsSync(root)) { console.error(`Path not found: ${root}`); process.exit(1); }

  const { tree, langBytes, files, count } = walk(root);
  const languages = Object.entries(langBytes).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const manifests = MANIFESTS.filter((m) => existsSync(join(root, m)));
  const configs = CONFIGS.filter((c) => existsSync(join(root, c)));
  const entryPoints = ENTRIES.filter((e) => existsSync(join(root, e)));

  let deps = [];
  const pkg = safeRead(join(root, 'package.json'));
  if (pkg) { try { const j = JSON.parse(pkg); deps = Object.keys({ ...j.dependencies, ...j.devDependencies }); } catch { /* skip */ } }
  const pyproject = safeRead(join(root, 'pyproject.toml')) || safeRead(join(root, 'requirements.txt')) || '';
  const depBlob = deps.join(' ') + ' ' + pyproject + ' ' + languages.join(' ');
  const category = (CATEGORY_HINTS.find((h) => h.re.test(depBlob)) || { cat: 'topic' }).cat;

  const importantDirs = (tree?.children || []).filter((c) => c.kind === 'dir').map((c) => c.path);
  const hasTests = files.some((f) => /(^|\/)(tests?|__tests__|spec)(\/|$)/i.test(f) || /\.(test|spec)\.[a-z]+$/i.test(f));
  const hasAuth = files.some((f) => /auth|session|login|token|password/i.test(f));
  const hasDb = files.some((f) => /schema\.prisma|models?\/|migrations?\/|\.sql$|sqlmodel|sqlalchemy/i.test(f)) || /prisma|sqlmodel|sqlalchemy|mongoose|postgres|sqlite/i.test(depBlob);
  const apis = files.filter((f) => /(routes?|controllers?|api|endpoints?)\//i.test(f)).slice(0, 20);
  const importantFiles = files.filter((f) => /(main|index|app|server|config|routes?|api|models?)\.[a-z]+$/i.test(f)).slice(0, 30);

  const manifest = {
    generatedAt: new Date().toISOString(),
    root, fingerprint: gitSha(root) || `hash:${files.length}`,
    category, fileCount: count,
    languages, manifests, configs, entryPoints,
    dependencies: deps.slice(0, 60),
    importantDirs, importantFiles, apis,
    tests: hasTests, authentication: hasAuth, database: hasDb,
    readmeSections: readmeSections(root),
    repoMap: tree,
  };

  const json = JSON.stringify(manifest, null, 2);
  if (out) { writeFileSync(out, json + '\n'); console.log(`Wrote ${out} (${count} files, category=${category})`); }
  else process.stdout.write(json + '\n');
}

main();
