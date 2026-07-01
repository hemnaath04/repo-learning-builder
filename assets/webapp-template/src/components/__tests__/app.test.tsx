// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppProvider } from '../../context/AppContext';
import { App } from '../App';
import { loadCourse } from '../../lib/expand';
import type { CourseRegistry } from '../../lib/schema';

vi.mock('../Mermaid', () => ({ Mermaid: () => null }));

// jsdom import.meta.url is not a file URL, so read from the project cwd.
const raw = JSON.parse(readFileSync(join(process.cwd(), 'public/courses/claimfarm/course.json'), 'utf8'));
const course = loadCourse(raw);
const registry: CourseRegistry = { courses: [
  { id: 'claimfarm', title: 'Understanding ClaimFarm' },
  { id: 'dns', title: 'How DNS Works' },
] };

beforeAll(() => {
  window.matchMedia = window.matchMedia || (((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } })) as any);
  window.scrollTo = (() => {}) as any;
});
afterEach(() => { cleanup(); window.location.hash = ''; });

function renderApp() {
  return render(<AppProvider initialCourse={course} initialRegistry={registry}><App /></AppProvider>);
}

describe('Atlas app', () => {
  it('renders the atlas with landmarks and a course switcher', () => {
    renderApp();
    expect(document.documentElement.dataset.themeName).toBe('atlas');
    expect(screen.getAllByText('Understanding ClaimFarm').length).toBeGreaterThan(0);
    // landmark labels (module titles) appear on the atlas
    expect(screen.getAllByText('The five-minute story').length).toBeGreaterThan(0);
    // course switcher lists both courses
    expect(screen.getByRole('option', { name: 'How DNS Works' })).toBeTruthy();
  });

  it('opens a lesson from the dock', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /What is ClaimFarm/i })[0]);
    expect(screen.getByRole('heading', { name: /What is ClaimFarm/i })).toBeTruthy();
  });

  it('switches concept facets (the five questions)', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /What is ClaimFarm/i })[0]);
    const why = screen.getByRole('tab', { name: /Why does it exist/i });
    fireEvent.click(why);
    expect(why.getAttribute('aria-selected')).toBe('true');
  });

  it('moves to the next lesson with ArrowRight', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /What is ClaimFarm/i })[0]);
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: /Why most farmers never file/i })).toBeTruthy();
  });

  it('shows an empty state when the registry has no courses', async () => {
    render(<AppProvider initialRegistry={{ courses: [] }}><App /></AppProvider>);
    await waitFor(() => expect(screen.getByText(/No courses yet/i)).toBeTruthy());
  });
});
