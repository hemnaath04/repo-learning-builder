#!/usr/bin/env node
// Deterministically create a compact course skeleton: stable ids, module and
// lesson ids, archetypes, difficulty, estimated duration, recommended sequence,
// and empty content slots. The model fills one lesson at a time afterward.
// Usage:
//   node create-course-scaffold.mjs --id <id> --title "<title>" \
//     --source repository|github-url|topic|lesson --depth quick|standard|deep \
//     [--manifest source-manifest.json] [--out course.scaffold.json]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

function arg(name, def) { const i = process.argv.indexOf(`--${name}`); return i !== -1 ? process.argv[i + 1] : def; }

// Recommended arcs by source kind. Trimmed to the depth budget; no filler.
const REPO_ARC = [
  ['m-story', 'The five-minute story', [['l-story', 'story']]],
  ['m-problem', 'The problem', [['l-problem', 'concept']]],
  ['m-arch', 'Architecture and journey', [['l-arch', 'architecture'], ['l-flow', 'request-flow']]],
  ['m-code', 'The code up close', [['l-tech', 'technology'], ['l-code', 'code-walkthrough']]],
  ['m-data', 'Data and running it', [['l-data', 'concept'], ['l-run', 'customization']]],
  ['m-quality', 'Quality and comparison', [['l-compare', 'comparison'], ['l-debug', 'debugging'], ['l-exercise', 'exercise']]],
  ['m-more', 'Going deeper', [['l-api', 'architecture'], ['l-overview', 'overview']]],
  ['m-ship', 'Mastery', [['l-mastery', 'teach-back']]],
];
const TOPIC_ARC = [
  ['m-story', 'The idea', [['l-what', 'story']]],
  ['m-core', 'Core concepts', [['l-c1', 'concept'], ['l-c2', 'concept']]],
  ['m-how', 'How it works', [['l-how', 'architecture'], ['l-example', 'concept']]],
  ['m-apply', 'Apply and master', [['l-try', 'exercise'], ['l-mastery', 'teach-back']]],
];
const BUDGET = { quick: [3, 5, 5], standard: [6, 12, 6], deep: [12, 20, 8] }; // [min,max,estPerLesson]

function main() {
  const id = arg('id'); const title = arg('title', id);
  const source = arg('source', 'repository'); const depth = arg('depth', 'standard');
  const out = arg('out'); const manifestPath = arg('manifest');
  if (!id) { console.error('Usage: create-course-scaffold.mjs --id <id> --title "<t>" --source <kind> --depth <quick|standard|deep>'); process.exit(1); }

  let manifest = {};
  if (manifestPath && existsSync(manifestPath)) { try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { /* ignore */ } }

  const isTopic = source === 'topic' || source === 'lesson';
  const arc = isTopic ? TOPIC_ARC : REPO_ARC;
  const [, max, est] = BUDGET[depth] ?? BUDGET.standard;

  // Flatten arc lessons, trim to the depth's max, then regroup into their modules.
  const flat = arc.flatMap(([mid, mtitle, lessons]) => lessons.map(([lid, type]) => ({ mid, mtitle, lid, type })));
  const chosen = flat.slice(0, source === 'lesson' ? 1 : Math.min(max, flat.length));

  const modulesMap = new Map();
  chosen.forEach((c, i) => {
    if (!modulesMap.has(c.mid)) modulesMap.set(c.mid, { id: c.mid, title: c.mtitle, summary: '', lessons: [] });
    modulesMap.get(c.mid).lessons.push({
      id: c.lid, type: c.type, title: '', summary: '',
      est, difficulty: Math.min(3, 1 + Math.floor(i / Math.max(1, chosen.length / 3))),
      conceptIds: [], sourceIds: [], sections: {}, checks: [],
    });
  });

  const scaffold = {
    schemaVersion: 3,
    meta: {
      id, title,
      sourceType: source, sourceRef: manifest.root || '', sourceFingerprint: manifest.fingerprint || '',
      generatedAt: new Date().toISOString(),
      category: manifest.category || (isTopic ? 'topic' : 'backend'),
      depth, levels: ['eli10', 'beginner', 'intermediate', 'advanced'], defaultLevel: 'beginner',
      outcomes: [],
    },
    registries: { concepts: {}, technologies: {}, sources: {}, glossary: {} },
    checks: {},
    diagrams: {},
    repoMap: manifest.repoMap || null,
    modules: [...modulesMap.values()],
  };

  const json = JSON.stringify(scaffold, null, 2);
  if (out) { writeFileSync(out, json + '\n'); console.log(`Wrote ${out}: ${chosen.length} lessons in ${modulesMap.size} modules (${depth}).`); }
  else process.stdout.write(json + '\n');
}

main();
