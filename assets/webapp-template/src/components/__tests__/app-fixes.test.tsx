// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppProvider } from '../../context/AppContext';
import { App } from '../App';
import { loadCourse } from '../../lib/expand';
import type { CourseRegistry } from '../../lib/schema';

vi.mock('../Mermaid', () => ({ Mermaid: () => null }));

const cwd = process.cwd();
const rawClaim = JSON.parse(readFileSync(join(cwd, 'public/courses/claimfarm/course.json'), 'utf8'));
const course = loadCourse(rawClaim);
const registry: CourseRegistry = { courses: [
  { id: 'claimfarm', title: 'Understanding ClaimFarm' },
  { id: 'dns', title: 'How DNS Works' },
] };

const memStore = new Map<string, string>();
beforeAll(() => {
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } })) as any);
  window.scrollTo = (() => {}) as any;
  (globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
  // The jsdom localStorage shim is partial here; install a complete in-memory one.
  const ls = {
    getItem: (k: string) => (memStore.has(k) ? memStore.get(k)! : null),
    setItem: (k: string, v: string) => void memStore.set(k, String(v)),
    removeItem: (k: string) => void memStore.delete(k),
    clear: () => memStore.clear(),
    key: (i: number) => [...memStore.keys()][i] ?? null,
    get length() { return memStore.size; },
  };
  Object.defineProperty(window, 'localStorage', { value: ls, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
});
beforeEach(() => { window.location.hash = ''; memStore.clear(); });
afterEach(cleanup);

const renderApp = () => render(<AppProvider initialCourse={course} initialRegistry={registry}><App /></AppProvider>);
const openFirstLesson = () => fireEvent.click(screen.getAllByRole('button', { name: /What ClaimFarm is/i })[0]);

describe('navigation state', () => {
  it('derives active section from the route', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: 'Notebook' })[0]);
    expect(screen.getAllByRole('button', { name: 'Notebook' }).some((b) => b.getAttribute('aria-current') === 'page')).toBe(true);
    // opening a lesson makes Learning map active again (lesson is under the map)
    fireEvent.click(screen.getAllByRole('button', { name: 'Learning map' })[0]);
    openFirstLesson();
    expect(screen.getAllByRole('button', { name: 'Learning map' }).some((b) => b.getAttribute('aria-current') === 'page')).toBe(true);
  });
});

describe('lesson fixes', () => {
  it('primary is "Complete and continue" and there is no duplicate complete control', () => {
    renderApp();
    openFirstLesson();
    expect(screen.getByRole('button', { name: /Complete and continue/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Mark complete$/i })).toBeNull();
  });

  it('resets the facet to "What is it?" on the next lesson', () => {
    renderApp();
    openFirstLesson();
    fireEvent.click(screen.getByRole('tab', { name: /Why does it exist/i }));
    expect(screen.getByRole('tab', { name: /Why does it exist/i }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /What is it/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: /Why does it exist/i }).getAttribute('aria-selected')).toBe('false');
  });
});

describe('mobile lesson sheet', () => {
  it('opens a body-level dialog, traps focus, and closes on Escape', () => {
    renderApp();
    const trigger = screen.getByRole('button', { name: /^1\. Orientation/i });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    // portaled to <body>, not nested in the transformed .atlas-page
    expect(dialog.closest('.atlas-page')).toBeNull();
    expect(dialog.parentElement === document.body || dialog.parentElement?.parentElement === document.body).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true); // focus moved into the sheet
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('course switching', () => {
  it('syncs the hash, persists the course, uses topic labels, and hides Repository', async () => {
    const routes: Record<string, unknown> = {
      'claimfarm': rawClaim,
      'dns': JSON.parse(readFileSync(join(cwd, 'public/courses/dns/course.json'), 'utf8')),
      'index': JSON.parse(readFileSync(join(cwd, 'public/courses/index.json'), 'utf8')),
    };
    global.fetch = vi.fn(async (u: any) => {
      const url = String(u);
      const key = url.includes('index.json') ? 'index' : url.includes('/dns/') ? 'dns' : 'claimfarm';
      return { ok: true, status: 200, json: async () => routes[key] } as any;
    });
    render(<AppProvider><App /></AppProvider>);
    await screen.findByLabelText('Course');
    fireEvent.change(screen.getByLabelText('Course'), { target: { value: 'dns' } });
    await waitFor(() => expect(window.location.hash).toMatch(/^#\/dns/));
    expect(localStorage.getItem('rlb:lastCourse')).toBe('dns');
    await waitFor(() => expect(screen.getByText('Your learning route')).toBeTruthy());
    expect(screen.queryAllByRole('button', { name: 'Repository' }).length).toBe(0);
  });
});
