import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateCourse, orderedLessons } from '../schema';
import { loadCourse } from '../expand';
import { SECTION_LABELS, archetypeSpec } from '../archetypes';

function readCourse(id: string) {
  return JSON.parse(readFileSync(new URL(`../../../public/courses/${id}/course.json`, import.meta.url), 'utf8'));
}
const claimfarm = readCourse('claimfarm');
const dns = readCourse('dns');

describe('compact v3 validation + expansion', () => {
  it('validates both bundled courses', () => {
    expect(validateCourse(claimfarm).errors).toEqual([]);
    expect(validateCourse(dns).errors).toEqual([]);
  });

  it('expands sections into labelled facets using renderer labels', () => {
    const course = loadCourse(claimfarm);
    const lesson = orderedLessons(course).find((l) => l.facets && l.facets.length)!;
    const what = lesson.facets!.find((f) => f.key === 'what');
    expect(what?.label).toBe(SECTION_LABELS.what);
    expect(lesson.typeLabel).toBe(archetypeSpec(lesson.type).label);
  });

  it('resolves checks into quiz items and registry ids into objects', () => {
    const course = loadCourse(claimfarm);
    const withQuiz = orderedLessons(course).find((l) => l.quiz && l.quiz.length)!;
    expect(withQuiz.quiz![0].question).toBeTruthy();
    expect(withQuiz.quiz![0].options.length).toBeGreaterThanOrEqual(2);
    const withTech = orderedLessons(course).find((l) => l.tech && l.tech.length)!;
    expect(withTech.tech![0].name).toBeTruthy();
    const withSrc = orderedLessons(course).find((l) => l.sources && l.sources.length)!;
    expect(withSrc.sources![0].path).toBeTruthy();
  });

  it('exposes concepts, technologies, glossary, diagrams', () => {
    const course = loadCourse(claimfarm);
    expect(course.concepts.length).toBeGreaterThan(0);
    expect(course.technologies.length).toBeGreaterThan(0);
    expect(course.glossary.length).toBeGreaterThan(0);
    expect(course.diagrams.length).toBeGreaterThan(0);
    expect(course.repoMap).not.toBeNull();
  });

  it('rejects a v2 course and an unknown archetype', () => {
    expect(validateCourse({ schemaVersion: 2 }).ok).toBe(false);
    const bad = { schemaVersion: 3, meta: { id: 'x', title: 'X', sourceType: 'topic', generatedAt: 'n' }, modules: [{ id: 'm', title: 'M', lessons: [{ id: 'l', title: 'L', type: 'nope', summary: 'x' }] }] };
    const r = validateCourse(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('archetype'))).toBe(true);
  });
});
