import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Guards that the permanent design system keeps its accessibility + responsive
// affordances and all four themes. Visual polish is verified via screenshots.
const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

describe('design system CSS', () => {
  it('honors reduced motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('defines all four themes in light and dark', () => {
    for (const t of ['explorer', 'laboratory', 'storybook', 'blueprint']) {
      expect(css).toContain(`[data-theme-name='${t}'][data-theme='light']`);
      expect(css).toContain(`[data-theme-name='${t}'][data-theme='dark']`);
    }
  });

  it('has responsive breakpoints for tablet and mobile', () => {
    expect(css).toContain('@media (max-width: 1080px)');
    expect(css).toContain('@media (max-width: 860px)');
    expect(css).toContain('@media (max-width: 420px)');
  });

  it('prevents overview metadata from overflowing (no-overlap guard)', () => {
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))');
  });

  it('supports print', () => {
    expect(css).toContain('@media print');
  });
});
