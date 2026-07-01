#!/usr/bin/env node
// Compute a stable fingerprint for a source so analysis can be cached and
// regeneration can tell whether anything changed.
// Usage: node fingerprint-source.mjs <repoPath>
// Prefers a git commit SHA; falls back to an FNV-1a hash of the file listing.

import { execSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const IGNORE = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', '__pycache__', '.cache', 'target', 'coverage']);

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function gitSha(root) {
  try { return execSync('git rev-parse HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
}

function listFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORE.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) { try { out.push(`${relative(root, p)}:${statSync(p).size}`); } catch { /* skip */ } }
    }
  };
  walk(root);
  return out.sort();
}

function main() {
  const root = process.argv[2] || process.cwd();
  if (!existsSync(root)) { console.error(`Path not found: ${root}`); process.exit(1); }
  const sha = gitSha(root);
  const fingerprint = sha ? sha.slice(0, 40) : fnv1a(listFiles(root).join('\n'));
  process.stdout.write(JSON.stringify({ fingerprint, method: sha ? 'git-sha' : 'file-hash', root }, null, 2) + '\n');
}

main();
