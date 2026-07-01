import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

type MermaidApi = typeof import('mermaid')['default'];
let mermaidPromise: Promise<MermaidApi> | null = null;

// Load Mermaid lazily so it stays out of the initial bundle.
function getMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) mermaidPromise = import('mermaid').then((m) => m.default);
  return mermaidPromise;
}

let counter = 0;

export function Mermaid({ code, title }: { code: string; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { effectiveTheme } = useApp();
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mmd-${counter++}`);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    getMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: effectiveTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
        });
        const { svg } = await mermaid.render(`${idRef.current}-${effectiveTheme}`, code);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, effectiveTheme]);

  if (failed) {
    return (
      <pre className="diagram-fallback" aria-label={title ?? 'diagram source'}>
        <code>{code}</code>
      </pre>
    );
  }
  return <div className="mermaid-diagram" ref={ref} role="img" aria-label={title ?? 'diagram'} />;
}
