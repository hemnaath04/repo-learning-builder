import { describe, it, expect } from 'vitest';
import { computeFingerprint, fnv1a, planRegeneration } from '../regen';
import { loadCourse } from '../expand';
import type { Course } from '../schema';
import raw from '../../data';

describe('fingerprinting', () => {
  it('is deterministic for the same file listing', () => {
    const a = computeFingerprint({ files: [{ path: 'a.ts', size: 10 }, { path: 'b.ts', size: 20 }] });
    const b = computeFingerprint({ files: [{ path: 'b.ts', size: 20 }, { path: 'a.ts', size: 10 }] });
    expect(a).toBe(b); // order-independent
  });

  it('changes when a file changes', () => {
    const a = computeFingerprint({ files: [{ path: 'a.ts', size: 10 }] });
    const b = computeFingerprint({ files: [{ path: 'a.ts', size: 11 }] });
    expect(a).not.toBe(b);
  });

  it('prefers a git sha', () => {
    expect(computeFingerprint({ sha: 'abcdef1234567890' })).toBe('abcdef1234567890');
    expect(fnv1a('x')).toHaveLength(8);
  });
});

describe('incremental regeneration planning', () => {
  const base = loadCourse(raw);

  it('reports no change for an identical course', () => {
    const plan = planRegeneration(base, base);
    expect(plan.unchanged).toBe(true);
    expect(plan.added).toEqual([]);
    expect(plan.removed).toEqual([]);
  });

  it('keeps surviving lesson ids and diffs the rest', () => {
    // Simulate a regenerated course: drop the last module, add a new lesson.
    const next: Course = {
      ...base,
      meta: { ...base.meta, sourceFingerprint: 'new-sha' },
      modules: [
        ...base.modules.slice(0, base.modules.length - 1),
        {
          id: 'm-new', title: 'New', order: 99,
          lessons: [{ ...base.modules[0].lessons[0], id: 'l-brand-new' }],
        },
      ],
    };
    const plan = planRegeneration(base, next);
    expect(plan.fingerprintChanged).toBe(true);
    expect(plan.unchanged).toBe(false);
    expect(plan.added).toContain('l-brand-new');
    expect(plan.kept).toContain('l-story'); // stable id survives, progress preserved
    // lessons from the dropped last module are removed
    expect(plan.removed.length).toBeGreaterThan(0);
  });
});
