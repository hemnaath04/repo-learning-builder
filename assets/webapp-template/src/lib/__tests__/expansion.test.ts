import { describe, it, expect } from 'vitest';
import { validateCourse, orderedLessons } from '../schema';
import { loadCourse, expandCourse } from '../expand';
import { ARCHETYPES } from '../archetypes';
import raw from '../../data';

describe('compact course validation + expansion', () => {
  it('validates the bundled compact course', () => {
    const result = validateCourse(raw);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('expands compact data into the runtime model', () => {
    const course = loadCourse(raw);
    expect(course.schemaVersion).toBe(2);
    expect(course.modules.length).toBeGreaterThan(0);
    expect(course.concepts.length).toBeGreaterThan(0);
    expect(course.tech.length).toBeGreaterThan(0);
    expect(course.glossary.length).toBeGreaterThan(0);
    expect(course.diagrams.length).toBeGreaterThan(0);
  });

  it('applies archetype structure the generated data does not repeat', () => {
    const course = loadCourse(raw);
    const lesson = orderedLessons(course).find((l) => l.facets && l.facets.length)!;
    // Facet labels come from the archetype, not the course JSON.
    const spec = ARCHETYPES[lesson.archetype];
    const what = lesson.facets!.find((f) => f.key === 'what');
    expect(what?.label).toBe(spec.facetLabels.what);
    // Lesson kind + icon are derived from the archetype.
    expect(lesson.kind).toBe(spec.kind);
    expect(lesson.icon).toBe(spec.icon);
    expect(lesson.typeLabel).toBe(spec.label);
  });

  it('resolves registry references into inline objects', () => {
    const course = loadCourse(raw);
    const withSources = orderedLessons(course).find((l) => l.sources && l.sources.length)!;
    expect(withSources.sources![0].path).toBeTruthy();
    const withTech = orderedLessons(course).find((l) => l.tech && l.tech.length)!;
    expect(withTech.tech![0].name).toBeTruthy();
  });

  it('derives a recap from concept summaries when none is authored', () => {
    const compact = {
      schemaVersion: 2,
      meta: { id: 'c', title: 'C', sourceType: 'topic', generatedAt: 'now', levels: ['beginner'], defaultLevel: 'beginner' },
      registries: { concepts: { 'c-x': { name: 'Thing', summary: 'A summary of the thing.' } } },
      modules: [
        { id: 'm', title: 'M', lessons: [
          { id: 'l', title: 'L', archetype: 'concept', concepts: ['c-x'], levels: { beginner: 'x' } },
        ] },
      ],
    };
    const course = expandCourse(compact as any);
    expect(course.modules[0].lessons[0].recap).toEqual(['A summary of the thing.']);
  });

  it('rejects invalid data and a v1 schema', () => {
    expect(validateCourse({ schemaVersion: 2, meta: { id: 'x' }, modules: [] }).ok).toBe(false);
    expect(() => loadCourse({ schemaVersion: 1 })).toThrow();
  });

  it('flags an unknown archetype', () => {
    const bad = {
      schemaVersion: 2,
      meta: { id: 'c', title: 'C', sourceType: 'topic', generatedAt: 'now', levels: ['beginner'], defaultLevel: 'beginner' },
      modules: [{ id: 'm', title: 'M', lessons: [{ id: 'l', title: 'L', archetype: 'nope', levels: { beginner: 'x' } }] }],
    };
    const res = validateCourse(bad);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes('archetype'))).toBe(true);
  });
});
