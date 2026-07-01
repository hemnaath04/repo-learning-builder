import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, writeFileSync, readFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = (n: string) => fileURLToPath(new URL(`../../../../../scripts/${n}`, import.meta.url));
const publicCourses = (id: string) => fileURLToPath(new URL(`../../../public/courses/${id}/course.json`, import.meta.url));
const promptsDir = fileURLToPath(new URL('../../../../../prompts/', import.meta.url));

function run(name: string, args: string[]): { code: number; out: string } {
  try { return { code: 0, out: execFileSync('node', [script(name), ...args], { encoding: 'utf8' }) }; }
  catch (e: any) { return { code: e.status ?? 1, out: (e.stdout ?? '') + (e.stderr ?? '') }; }
}

describe('deterministic pipeline scripts', () => {
  it('installs the template once and is idempotent (no app rebuild)', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'rlb-')), 'learning-app');
    run('install-template.mjs', ['--dest', dest]);
    expect(existsSync(join(dest, 'src', 'components', 'App.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'public', 'courses'))).toBe(true);
    const before = readFileSync(join(dest, 'src', 'components', 'App.tsx'), 'utf8');
    const second = run('install-template.mjs', ['--dest', dest]);
    expect(second.out).toMatch(/already installed/i);
    expect(readFileSync(join(dest, 'src', 'components', 'App.tsx'), 'utf8')).toBe(before); // untouched
  });

  it('scaffolds within the depth budget and by source mode', () => {
    const count = (out: string) => { const c = JSON.parse(out); return c.modules.reduce((n: number, m: any) => n + m.lessons.length, 0); };
    const quick = count(run('create-course-scaffold.mjs', ['--id', 'q', '--source', 'repository', '--depth', 'quick']).out);
    const std = count(run('create-course-scaffold.mjs', ['--id', 's', '--source', 'repository', '--depth', 'standard']).out);
    const deep = count(run('create-course-scaffold.mjs', ['--id', 'd', '--source', 'repository', '--depth', 'deep']).out);
    expect(quick).toBeGreaterThanOrEqual(3); expect(quick).toBeLessThanOrEqual(5);
    expect(std).toBeGreaterThanOrEqual(6); expect(std).toBeLessThanOrEqual(12);
    expect(deep).toBeGreaterThan(std);
    const topic = JSON.parse(run('create-course-scaffold.mjs', ['--id', 't', '--source', 'topic', '--depth', 'quick']).out);
    expect(topic.modules.flatMap((m: any) => m.lessons).some((l: any) => l.id === 'l-what')).toBe(true);
    const one = JSON.parse(run('create-course-scaffold.mjs', ['--id', 'o', '--source', 'lesson', '--depth', 'quick']).out);
    expect(one.modules.reduce((n: number, m: any) => n + m.lessons.length, 0)).toBe(1);
  });

  it('validates a whole course and repairs a lesson field-by-field', () => {
    const ok = run('validate-lesson.mjs', [publicCourses('claimfarm'), '--course']);
    expect(ok.code).toBe(0);
    const dir = mkdtempSync(join(tmpdir(), 'rlb-l-'));
    const bad = join(dir, 'lesson.json');
    writeFileSync(bad, JSON.stringify({ id: 'l1', title: 'L', type: 'nope' }));
    const r1 = run('validate-lesson.mjs', [bad]);
    expect(r1.code).toBe(1);
    const errs = JSON.parse(r1.out).errors.map((e: any) => e.field);
    expect(errs).toContain('type');
    expect(errs).toContain('sections');
    // repair only the reported fields
    writeFileSync(bad, JSON.stringify({ id: 'l1', title: 'L', type: 'concept', summary: 'A fixed lesson.' }));
    expect(run('validate-lesson.mjs', [bad]).code).toBe(0);
  });

  it('adds a second course by data only (register-course, src untouched)', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'rlb2-')), 'learning-app');
    run('install-template.mjs', ['--dest', dest]);
    const srcBefore = readFileSync(join(dest, 'src', 'context', 'AppContext.tsx'), 'utf8');
    mkdirSync(join(dest, 'public', 'courses', 'dns'), { recursive: true });
    cpSync(publicCourses('dns'), join(dest, 'public', 'courses', 'dns', 'course.json'));
    const reg = run('register-course.mjs', ['--app', dest, '--course', join(dest, 'public', 'courses', 'dns', 'course.json')]);
    expect(reg.code).toBe(0);
    const index = JSON.parse(readFileSync(join(dest, 'public', 'courses', 'index.json'), 'utf8'));
    expect(index.courses.some((c: any) => c.id === 'dns')).toBe(true);
    expect(readFileSync(join(dest, 'src', 'context', 'AppContext.tsx'), 'utf8')).toBe(srcBefore); // no app change
  });

  it('keeps prompts small enough for Haiku-class context', () => {
    for (const p of ['plan-course.md', 'generate-lesson.md', 'generate-quiz.md', 'generate-glossary.md', 'repair-json.md']) {
      const bytes = readFileSync(join(promptsDir, p), 'utf8').length;
      expect(bytes).toBeLessThan(2600);
    }
  });
});
