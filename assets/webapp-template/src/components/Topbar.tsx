import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ExplanationLevel } from '../lib/schema';
import type { ThemePref } from '../lib/progress';
import { THEMES, THEME_NAMES } from '../lib/theme';
import { Icon } from './Icon';

const LEVEL_LABELS: Record<ExplanationLevel, string> = {
  eli10: 'Explain like I am 10',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const THEME_ICONS: Record<ThemePref, string> = { light: 'Sun', dark: 'Moon', system: 'Monitor' };

export function Topbar() {
  const { course, level, setLevel, theme, setTheme, themeName, setThemeName, navigate, route } = useApp();
  const [q, setQ] = useState(route.name === 'search' ? route.q : '');

  const submitSearch = (value: string) => {
    setQ(value);
    if (value.trim().length >= 2) navigate({ name: 'search', q: value });
  };
  const cycleTheme = () => {
    const order: ThemePref[] = ['system', 'light', 'dark'];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate({ name: 'home' })}>
        <span className="brand-mark">
          <Icon name={course.theme.icon || THEMES[themeName].icon} size={18} />
        </span>
        <span>{course.meta.title}</span>
      </button>

      <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); submitSearch(q); }}>
        <Icon name="Search" size={16} className="search-icon" />
        <input
          type="search"
          aria-label="Search the course"
          placeholder="Search lessons and glossary..."
          value={q}
          onChange={(e) => submitSearch(e.target.value)}
        />
      </form>

      <div className="topbar-controls">
        <label className="chip" style={{ gap: 6 }}>
          <Icon name="GraduationCap" size={14} />
          <select value={level} onChange={(e) => setLevel(e.target.value as ExplanationLevel)} aria-label="Explanation level" style={{ border: 'none', background: 'none', padding: 0 }}>
            {course.meta.levels.map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>
            ))}
          </select>
        </label>

        <label className="chip" style={{ gap: 6 }} title="Visual theme">
          <Icon name="Sparkles" size={14} />
          <select
            value={themeName}
            onChange={(e) => setThemeName(e.target.value as any)}
            aria-label="Visual theme"
            style={{ border: 'none', background: 'none', padding: 0 }}
          >
            {THEME_NAMES.map((n) => (
              <option key={n} value={n}>{THEMES[n].label}</option>
            ))}
          </select>
        </label>

        <button className="btn ghost" onClick={cycleTheme} aria-label={`Color mode: ${theme}`} title={`Color mode: ${theme}`}>
          <Icon name={THEME_ICONS[theme]} size={16} />
        </button>
      </div>
    </header>
  );
}
