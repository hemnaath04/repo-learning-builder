import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { ExplanationLevel } from '../lib/schema';
import type { ThemePref } from '../lib/progress';
import { Icon } from './Icon';

const THEMES: ThemePref[] = ['light', 'dark', 'system'];
const LEVELS: Array<{ id: ExplanationLevel; label: string }> = [
  { id: 'eli10', label: 'Age 10' }, { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' }, { id: 'advanced', label: 'Advanced' },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function Settings() {
  const { course, progress, theme, setTheme, actions, navigate } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  if (!course || !progress) return null;

  return (
    <div className="page reveal" style={{ maxWidth: 720 }}>
      <h1><Icon name="Settings" size={22} /> Settings</h1>

      <div className="settings-row">
        <div><strong>Color mode</strong><p className="muted" style={{ margin: 0 }}>Light, dark, or follow the system.</p></div>
        <div className="seg">{THEMES.map((t) => <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>)}</div>
      </div>

      <div className="settings-row">
        <div><strong>Explanation level</strong><p className="muted" style={{ margin: 0 }}>Used when new course content is generated.</p></div>
        <div className="seg">{LEVELS.map((l) => <button key={l.id} aria-pressed={progress.preferences.explanationLevel === l.id} onClick={() => actions.setPreference('explanationLevel', l.id)}>{l.label}</button>)}</div>
      </div>

      <div className="settings-row">
        <div><strong>Reading mode</strong><p className="muted" style={{ margin: 0 }}>Hide the side columns while reading a lesson.</p></div>
        <div className="seg">
          <button aria-pressed={!progress.preferences.reducedChrome} onClick={() => actions.setPreference('reducedChrome', false)}>Off</button>
          <button aria-pressed={progress.preferences.reducedChrome} onClick={() => actions.setPreference('reducedChrome', true)}>On</button>
        </div>
      </div>

      <div className="settings-row">
        <div><strong>Notes and bookmarks</strong><p className="muted" style={{ margin: 0 }}>Everything you saved in this course.</p></div>
        <button className="btn" onClick={() => navigate({ view: 'notes' })}><Icon name="Bookmark" size={14} /> Open notes</button>
      </div>

      <div className="settings-row">
        <div><strong>Your data</strong><p className="muted" style={{ margin: 0 }}>Progress is stored on this device.</p></div>
        <div className="identity-actions" style={{ margin: 0 }}>
          <button className="btn" onClick={() => download(`${course.meta.id}-progress.json`, actions.exportJSON())}><Icon name="Download" size={14} /> Export</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="Upload" size={14} /> Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { actions.importJSON(await f.text()); } catch (err) { alert(`Import failed: ${(err as Error).message}`); } } e.target.value = ''; }} />
          <button className="btn danger" onClick={() => { if (confirm('Reset all progress for this course?')) actions.reset(); }}><Icon name="RotateCcw" size={14} /> Reset</button>
        </div>
      </div>
    </div>
  );
}
