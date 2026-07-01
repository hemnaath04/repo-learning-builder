// Tiny in-memory search across lessons and glossary terms.

import type { Course, ExplanationLevel } from './schema';

export interface SearchResult {
  type: 'lesson' | 'glossary';
  id: string;
  title: string;
  snippet: string;
  lessonId?: string;
}

function textOf(strings: Array<string | undefined>): string {
  return strings.filter(Boolean).join(' ');
}

export function searchCourse(course: Course, query: string, level: ExplanationLevel): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const results: SearchResult[] = [];

  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const haystack = textOf([
        lesson.title,
        lesson.typeLabel,
        lesson.explanations[level],
        lesson.explanations.beginner,
        ...(lesson.facets ?? []).map((f) => f.body),
        ...(lesson.callouts ?? []).map((c) => c.body),
      ]).toLowerCase();
      const at = haystack.indexOf(q);
      if (at !== -1) {
        results.push({
          type: 'lesson',
          id: lesson.id,
          lessonId: lesson.id,
          title: lesson.title,
          snippet: makeSnippet(haystack, at, q),
        });
      }
    }
  }

  for (const entry of course.glossary ?? []) {
    const haystack = `${entry.term} ${entry.definition}`.toLowerCase();
    const at = haystack.indexOf(q);
    if (at !== -1) {
      results.push({
        type: 'glossary',
        id: `glossary-${entry.term}`,
        title: entry.term,
        snippet: entry.definition,
      });
    }
  }

  return results;
}

function makeSnippet(haystack: string, at: number, q: string): string {
  const start = Math.max(0, at - 40);
  const end = Math.min(haystack.length, at + q.length + 40);
  return `${start > 0 ? '...' : ''}${haystack.slice(start, end)}${end < haystack.length ? '...' : ''}`;
}
