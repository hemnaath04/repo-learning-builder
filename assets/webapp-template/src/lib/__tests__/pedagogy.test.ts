import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { expandCourse, loadCourse } from '../expand';
import { validateCourse, type CompactCourse } from '../schema';

const read = (id: string) => loadCourse(JSON.parse(readFileSync(new URL(`../../../public/courses/${id}/course.json`, import.meta.url), 'utf8')));

const base = (lesson: Record<string, unknown>): CompactCourse => ({
  schemaVersion: 3,
  meta: { id: 'x', title: 'X', sourceType: 'topic', generatedAt: 'now' } as CompactCourse['meta'],
  modules: [{ id: 'm1', title: 'M', lessons: [{ id: 'l1', type: 'concept', title: 'L', summary: 's', ...lesson } as never] }],
});

describe('pedagogy block expansion', () => {
  it('passes predict, worked, scenario, and figure through to the runtime lesson', () => {
    const c = expandCourse(base({
      predict: { question: 'q', options: ['a', 'b'], reveal: 'r' },
      worked: { intro: 'i', steps: [{ label: 's1', state: [{ k: 'x', v: '1' }] }], outcome: 'o' },
      scenario: { prompt: 'p', choices: [{ label: 'c1', steps: ['s'], outcome: 'o' }] },
      figure: { src: 'a.png', alt: 'alt' },
    }));
    const l = c.modules[0].lessons[0];
    expect(l.predict?.reveal).toBe('r');
    expect(l.worked?.steps[0].state?.[0]).toEqual({ k: 'x', v: '1' });
    expect(l.scenario?.choices[0].outcome).toBe('o');
    expect(l.figure?.src).toBe('a.png');
  });

  it('attaches analogyPairs to the analogy callout and keeps misconception as a callout', () => {
    const c = expandCourse(base({
      analogy: 'like a phone book',
      analogyPairs: [{ from: 'name', to: 'domain' }],
      misconception: 'DNS serves pages',
    }));
    const callouts = c.modules[0].lessons[0].callouts ?? [];
    const analogy = callouts.find((x) => x.kind === 'analogy');
    expect(analogy?.pairs).toEqual([{ from: 'name', to: 'domain' }]);
    expect(callouts.some((x) => x.kind === 'misconception')).toBe(true);
  });

  it('rejects malformed pedagogy blocks', () => {
    expect(validateCourse(base({ predict: { question: 'q' } })).ok).toBe(false);
    expect(validateCourse(base({ worked: { intro: 'i', steps: [] } })).ok).toBe(false);
    expect(validateCourse(base({ worked: { intro: 'i', steps: [{ label: 's', state: [{ k: 'x' }] }] } })).ok).toBe(false);
    expect(validateCourse(base({ scenario: { prompt: 'p', choices: [{ label: 'c' }] } })).ok).toBe(false);
    expect(validateCourse(base({ figure: { src: 'a.png' } })).ok).toBe(false);
    expect(validateCourse(base({ analogyPairs: [{ from: 'x' }] })).ok).toBe(false);
  });

  it('shipped courses carry the interactive blocks and stay valid', () => {
    const dns = read('dns');
    const dnsLessons = dns.modules.flatMap((m) => m.lessons);
    expect(dnsLessons.some((l) => l.worked)).toBe(true);
    expect(dnsLessons.some((l) => l.scenario)).toBe(true);
    expect(dnsLessons.some((l) => l.predict)).toBe(true);

    const cf = read('claimfarm');
    const cfLessons = cf.modules.flatMap((m) => m.lessons);
    const intake = cfLessons.find((l) => l.id === 'l-intake');
    expect(intake?.worked?.steps.length).toBeGreaterThanOrEqual(4);
    expect(intake?.predict).toBeTruthy();
    expect(cfLessons.find((l) => l.id === 'l-channels')?.scenario?.choices.length).toBe(3);
    const story = cfLessons.find((l) => l.id === 'l-story');
    expect(story?.callouts?.find((x) => x.kind === 'analogy')?.pairs?.length).toBeGreaterThan(2);
  });
});
