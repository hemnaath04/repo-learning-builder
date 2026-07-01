import { describe, it, expect } from 'vitest';
import { selectTheme, THEME_NAMES } from '../theme';

describe('theme selection', () => {
  it('maps categories to curated themes deterministically', () => {
    expect(selectTheme('web-app')).toBe('explorer');
    expect(selectTheme('backend')).toBe('laboratory');
    expect(selectTheme('ai-ml')).toBe('laboratory');
    expect(selectTheme('cli')).toBe('blueprint');
    expect(selectTheme('topic')).toBe('storybook');
  });

  it('is case-insensitive and falls back to a stable default', () => {
    expect(selectTheme('AI-ML')).toBe('laboratory');
    expect(selectTheme('something-unknown')).toBe('storybook');
    expect(selectTheme(undefined)).toBe('storybook');
  });

  it('honors an explicit valid override and ignores an invalid one', () => {
    expect(selectTheme('backend', 'storybook')).toBe('storybook');
    expect(selectTheme('backend', 'not-a-theme')).toBe('laboratory');
    for (const name of THEME_NAMES) expect(selectTheme('backend', name)).toBe(name);
  });
});
