#!/usr/bin/env node
// Emit a JSON summary of a repository to seed course analysis.
// Usage: node analyze-repository.mjs [repoPath] > summary.json
// Advisory only: read the actual code before authoring lessons.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', 'out', 'coverage',
  '.venv', 'venv', '__pycache__', '.cache', 'target', 'vendor', '.idea',
  '.vscode', 'Pods', 'DerivedData', '.turbo', '.svelte-kit',
]);

const EXT_LANG = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript',
  '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.py': 'Python', '.go': 'Go', '.rs': 'Rust', '.java': 'Java',
  '.kt': 'Kotlin', '.rb': 'Ruby', '.php': 'PHP', '.cs': 'C#',
  '.swift': 'Swift', '.c': 'C', '.h': 'C', '.cpp': 'C++', '.cc': 'C++',
  '.m': 'Objective-C', '.scala': 'Scala', '.sh': 'Shell', '.sql': 'SQL',
  '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML', '.vue': 'Vue',
  '.svelte': 'Svelte', '.dart': 'Dart', '.ex': 'Elixir', '.clj': 'Clojure',
};

const MANIFESTS = [
  'package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'go.mod',
  'Cargo.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'Gemfile',
  'composer.json', 'Package.swift', 'pubspec.yaml', 'mix.exs',
];

const CONFIG_HINTS = [
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'Makefile',
  'tsconfig.json', 'vite.config.ts', 'vite.config.js', 'next.config.js',
  'next.config.mjs', '.env.example', 'tailwind.config.js', 'tailwind.config.ts',
  'vercel.json', 'netlify.toml', 'serverless.yml', 'prisma/schema.prisma',
];

const ENTRY_CANDIDATES = [
  'src/index.ts', 'src/index.tsx', 'src/index.js', 'src/main.ts',
  'src/main.tsx', 'src/main.js', 'src/app.ts', 'src/App.tsx', 'index.js',
  'index.ts', 'main.py', 'app.py', '__main__.py', 'manage.py', 'main.go',
  'cmd/main.go', 'src/main.rs', 'src/lib.rs', 'server.js', 'server.ts',
];

function safeRead(p) {
  try { return readFileSync(p, 'utf8'); } catch { return null; }
}

function walk(root) {
  const langBytes = {};
  const files = [];
  let fileCount = 0;

  function build(dir, depth) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const node = { name: basename(dir) || dir, kind: 'dir', path: relative(root, dir) || '.', children: [] };
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.env.example') {
        if (IGNORE_DIRS.has(e.name)) continue;
      }
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        // Limit tree depth to keep the map readable; still count languages deeper.
        if (depth < 3) {
          const child = build(join(dir, e.name), depth + 1);
          if (child) node.children.push(child);
        } else {
          countDeep(join(dir, e.name));
        }
      } else if (e.isFile()) {
        fileCount++;
        const ext = extname(e.name).toLowerCase();
        const rel = relative(root, join(dir, e.name));
        files.push(rel);
        if (EXT_LANG[ext]) {
          try { langBytes[EXT_LANG[ext]] = (langBytes[EXT_LANG[ext]] || 0) + statSync(join(dir, e.name)).size; } catch { /* ignore */ }
        }
        if (depth <= 3) {
          node.children.push({ name: e.name, kind: 'file', path: rel });
        }
      }
    }
    return node;
  }

  function countDeep(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue;
        countDeep(join(dir, e.name));
      } else if (e.isFile()) {
        fileCount++;
        const ext = extname(e.name).toLowerCase();
        files.push(relative(root, join(dir, e.name)));
        if (EXT_LANG[ext]) {
          try { langBytes[EXT_LANG[ext]] = (langBytes[EXT_LANG[ext]] || 0) + statSync(join(dir, e.name)).size; } catch { /* ignore */ }
        }
      }
    }
  }

  const tree = build(root, 0);
  return { tree, langBytes, files, fileCount };
}

function detectDeps(root) {
  const deps = { frameworks: [], libraries: [], packageManagers: [] };
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const names = Object.keys(all);
      deps.libraries = names;
      const fw = ['react', 'next', 'vue', 'svelte', '@angular/core', 'express',
        'fastify', 'koa', '@nestjs/core', 'vite', 'astro', 'remix', '@remix-run/react'];
      deps.frameworks = fw.filter((f) => names.includes(f));
      if (existsSync(join(root, 'pnpm-lock.yaml'))) deps.packageManagers.push('pnpm');
      if (existsSync(join(root, 'yarn.lock'))) deps.packageManagers.push('yarn');
      if (existsSync(join(root, 'package-lock.json'))) deps.packageManagers.push('npm');
      deps.scripts = pkg.scripts || {};
    } catch { /* ignore */ }
  }
  if (existsSync(join(root, 'requirements.txt')) || existsSync(join(root, 'pyproject.toml'))) {
    deps.packageManagers.push('pip');
  }
  return deps;
}

function main() {
  const root = process.argv[2] ? process.argv[2] : process.cwd();
  if (!existsSync(root)) {
    console.error(`Path not found: ${root}`);
    process.exit(1);
  }

  const { tree, langBytes, files, fileCount } = walk(root);
  const languages = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, bytes }));

  const manifests = MANIFESTS.filter((m) => existsSync(join(root, m)));
  const configs = CONFIG_HINTS.filter((c) => existsSync(join(root, c)));
  const entryPoints = ENTRY_CANDIDATES.filter((e) => existsSync(join(root, e)));
  const readme = ['README.md', 'README.rst', 'README.txt', 'readme.md']
    .map((r) => join(root, r)).find((p) => existsSync(p));
  const readmeExcerpt = readme ? (safeRead(readme) || '').slice(0, 1200) : null;

  const summary = {
    generatedAt: new Date().toISOString(),
    root,
    fileCount,
    languages,
    primaryLanguage: languages[0]?.name || null,
    manifests,
    configs,
    entryPoints,
    dependencies: detectDeps(root),
    hasTests: files.some((f) => /(^|\/)(test|tests|__tests__|spec)(\/|$)/i.test(f) || /\.(test|spec)\.[a-z]+$/i.test(f)),
    readmeExcerpt,
    repoMap: tree,
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main();
