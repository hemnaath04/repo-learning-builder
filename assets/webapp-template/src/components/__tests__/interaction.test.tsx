// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { App } from '../App';

// Mermaid does a heavy dynamic import in an effect; stub it for interaction tests.
vi.mock('../Mermaid', () => ({ Mermaid: () => null }));

beforeAll(() => {
  // jsdom lacks these; the app guards for their absence but tests exercise them.
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as any);
  window.scrollTo = (() => {}) as any;
});

afterEach(cleanup);

function renderApp() {
  return render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
}

describe('navigation and interaction', () => {
  it('applies the deterministic theme palette from the course category', () => {
    renderApp();
    // ClaimFarm is category "ai-ml" -> laboratory theme.
    expect(document.documentElement.dataset.themeName).toBe('laboratory');
    expect(['light', 'dark']).toContain(document.documentElement.dataset.theme);
  });

  it('opens a lesson from the learning path', () => {
    renderApp();
    const links = screen.getAllByRole('button', { name: /Why most farmers never file a claim/i });
    fireEvent.click(links[0]);
    expect(screen.getByRole('heading', { name: /Why most farmers never file a claim/i })).toBeTruthy();
  });

  it('switches concept facets via the tab switcher', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /Why most farmers never file a claim/i })[0]);
    const whyTab = screen.getByRole('tab', { name: /Why does it exist/i });
    fireEvent.click(whyTab);
    expect(whyTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/unlocking claims that currently never happen/i)).toBeTruthy();
  });

  it('moves to the next lesson with the ArrowRight key', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /Why most farmers never file a claim/i })[0]);
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: /The eight steps/i })).toBeTruthy();
  });

  it('renders the lesson archetype badge', () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: /Why most farmers never file a claim/i })[0]);
    // "concept" archetype -> "Concept" badge supplied by the renderer, not data.
    expect(screen.getAllByText('Concept').length).toBeGreaterThan(0);
  });
});
