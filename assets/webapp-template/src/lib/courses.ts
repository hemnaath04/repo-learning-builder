// Runtime loading of many courses from public/courses/. The app is one permanent
// build; courses are data fetched at runtime, so adding a course never touches
// application code.

import { loadCourse } from './expand';
import type { Course, CourseRegistry } from './schema';

export function coursesBase(): string {
  const env = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL ?? '/';
  return `${base}courses/`;
}

export async function fetchRegistry(): Promise<CourseRegistry> {
  const res = await fetch(`${coursesBase()}index.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Course registry not found (${res.status})`);
  const data = (await res.json()) as CourseRegistry;
  if (!data || !Array.isArray(data.courses)) throw new Error('Malformed course registry');
  return data;
}

export async function fetchCourse(id: string): Promise<Course> {
  const res = await fetch(`${coursesBase()}${id}/course.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Course "${id}" not found (${res.status})`);
  return loadCourse(await res.json());
}
