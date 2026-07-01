import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { computeFingerprint, planRegeneration } from '../regen';
import { loadCourse } from '../expand';
import type { Course } from '../schema';

const raw = JSON.parse(readFileSync(new URL('../../../public/courses/claimfarm/course.json', import.meta.url), 'utf8'));

describe('fingerprint caching', () => {
  it('is deterministic and order-independent', () => {
    const a = computeFingerprint({ files: [{ path: 'a', size: 1 }, { path: 'b', size: 2 }] });
    const b = computeFingerprint({ files: [{ path: 'b', size: 2 }, { path: 'a', size: 1 }] });
    expect(a).toBe(b);
    expect(computeFingerprint({ sha: 'deadbeef' })).toBe('deadbeef');
  });
  it('changes when content changes (cache miss)', () => {
    expect(computeFingerprint({ files: [{ path: 'a', size: 1 }] })).not.toBe(computeFingerprint({ files: [{ path: 'a', size: 2 }] }));
  });
});

describe('incremental regeneration', () => {
  const base = loadCourse(raw);
  it('reports unchanged for the same course', () => {
    expect(planRegeneration(base, base).unchanged).toBe(true);
  });
  it('keeps stable lesson ids and only diffs the rest', () => {
    const next: Course = {
      ...base,
      meta: { ...base.meta, sourceFingerprint: 'new' },
      modules: [...base.modules.slice(0, base.modules.length - 1), { id: 'm-new', title: 'New', lessons: [{ ...base.modules[0].lessons[0], id: 'l-brand-new' }] }],
    };
    const plan = planRegeneration(base, next);
    expect(plan.fingerprintChanged).toBe(true);
    expect(plan.added).toContain('l-brand-new');
    expect(plan.kept).toContain('l-story');
    expect(plan.removed.length).toBeGreaterThan(0);
  });
});
