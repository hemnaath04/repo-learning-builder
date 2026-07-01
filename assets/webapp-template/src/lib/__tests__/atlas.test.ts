import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadCourse } from '../expand';
import { landmarksFor, routeLabel, PRESET } from '../landmarks';

const read = (id: string) => loadCourse(JSON.parse(readFileSync(new URL(`../../../public/courses/${id}/course.json`, import.meta.url), 'utf8')));

describe('atlas landmarks', () => {
  it('shows every module as a landmark (nothing hidden)', () => {
    const cf = read('claimfarm');
    const lms = landmarksFor(cf, null);
    expect(lms.length).toBe(cf.modules.length); // was "6 of 7"; now all shown
    expect(cf.modules.length).toBeLessThanOrEqual(PRESET.length);
    // every module id is represented, in order
    expect(lms.map((l) => l.moduleId)).toEqual(cf.modules.map((m) => m.id));
  });

  it('works for a smaller (topic) course too', () => {
    const dns = read('dns');
    expect(landmarksFor(dns, null).length).toBe(dns.modules.length);
  });

  it('uses source-aware route labels', () => {
    expect(routeLabel('github-url')).toBe('Your route through the repository');
    expect(routeLabel('repository')).toBe('Your route through the repository');
    expect(routeLabel('topic')).toBe('Your learning route');
    expect(routeLabel('documents')).toBe('Your route through the material');
  });
});
