import { describe, it, expect } from 'vitest';
import { collectSourceRefs, validateSourceRefs } from '../sources';
import { loadCourse } from '../expand';
import raw from '../../data';

describe('source-reference validation', () => {
  const course = loadCourse(raw);

  it('collects cited source paths from lessons', () => {
    const refs = collectSourceRefs(course);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every((r) => typeof r.path === 'string' && r.path.length > 0)).toBe(true);
  });

  it('passes when every cited path exists', () => {
    const existing = collectSourceRefs(course).map((r) => r.path);
    const check = validateSourceRefs(course, existing);
    expect(check.ok).toBe(true);
    expect(check.missing).toEqual([]);
  });

  it('reports paths that do not exist in the source', () => {
    const check = validateSourceRefs(course, ['only/this/path.ts']);
    expect(check.ok).toBe(false);
    expect(check.missing.length).toBeGreaterThan(0);
  });
});
