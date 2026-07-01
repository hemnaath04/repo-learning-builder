// Source fingerprinting and incremental regeneration planning. Pure and
// deterministic so the same source always yields the same fingerprint and the
// same regeneration plan, which keeps analysis cacheable.

import { orderedLessons, type Course } from './schema';

/** FNV-1a 32-bit hash as an 8-char hex string. No crypto dependency. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface FingerprintInput {
  sha?: string; // prefer a git commit SHA when available
  files?: Array<{ path: string; size?: number; hash?: string }>;
}

/** A stable fingerprint of a source. A git SHA short-circuits to itself. */
export function computeFingerprint(input: FingerprintInput | string): string {
  if (typeof input === 'string') return input.slice(0, 40);
  if (input.sha) return input.sha.slice(0, 40);
  const files = [...(input.files ?? [])].sort((a, b) => a.path.localeCompare(b.path));
  const material = files.map((f) => `${f.path}:${f.size ?? ''}:${f.hash ?? ''}`).join('\n');
  return fnv1a(material);
}

export interface RegenPlan {
  fingerprintChanged: boolean;
  unchanged: boolean;
  kept: string[]; // lesson ids present in both (progress preserved)
  added: string[]; // lesson ids new in next
  removed: string[]; // lesson ids gone from prev
  keptConcepts: string[];
  removedConcepts: string[];
}

/**
 * Plan an incremental regeneration by diffing lesson and concept ids. Stable ids
 * that survive keep their learner progress; the rest are added or dropped.
 */
export function planRegeneration(prev: Course, next: Course): RegenPlan {
  const prevLessons = new Set(orderedLessons(prev).map((l) => l.id));
  const nextLessons = new Set(orderedLessons(next).map((l) => l.id));
  const prevConcepts = new Set(prev.concepts.map((c) => c.id));
  const nextConcepts = new Set(next.concepts.map((c) => c.id));

  const kept = [...nextLessons].filter((id) => prevLessons.has(id));
  const added = [...nextLessons].filter((id) => !prevLessons.has(id));
  const removed = [...prevLessons].filter((id) => !nextLessons.has(id));

  const fingerprintChanged = (prev.meta.sourceFingerprint ?? '') !== (next.meta.sourceFingerprint ?? '');

  return {
    fingerprintChanged,
    unchanged: !fingerprintChanged && added.length === 0 && removed.length === 0,
    kept,
    added,
    removed,
    keptConcepts: [...nextConcepts].filter((id) => prevConcepts.has(id)),
    removedConcepts: [...prevConcepts].filter((id) => !nextConcepts.has(id)),
  };
}
