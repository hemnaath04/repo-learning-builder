import { useState } from 'react';
import type { WalkthroughStep } from '../lib/schema';
import { useApp } from '../context/AppContext';
import { Icon } from './Icon';
import { Markdown } from './Markdown';

function CodeBlock({ code, highlight }: { code: string; highlight?: number[] }) {
  const hl = new Set(highlight ?? []);
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <pre className="wt-code">
      <code>
        {lines.map((line, i) => (
          <span key={i} className={hl.has(i + 1) ? 'hl' : undefined}>
            {line || ' '}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}

function Facts({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="wt-facts">
      <dt>{label}</dt>
      <dd><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></dd>
    </div>
  );
}

// Build a GitHub blob URL from a repository sourceRef like "github.com/owner/repo".
function openUrl(sourceRef: string | undefined, path?: string, lines?: string): string | null {
  if (!sourceRef || !path) return null;
  const m = sourceRef.replace(/^https?:\/\//, '').match(/^github\.com\/([^/\s]+\/[^/\s]+)/i);
  if (!m) return null;
  const first = lines?.split('-')[0];
  return `https://github.com/${m[1]}/blob/main/${path}${first ? `#L${first}` : ''}`;
}

export function CodeWalkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const { course } = useApp();
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const stepped = steps.length > 1;
  const step = steps[i];
  const href = openUrl(course?.meta.sourceRef, step.path, step.lines);

  const copyPath = async () => {
    if (!step.path) return;
    try { await navigator.clipboard.writeText(step.path + (step.lines ? `:${step.lines}` : '')); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="walkthrough">
      <div className="wt-step">
        <div className="wt-head">
          <span className="wt-file">
            {step.path ? <><code>{step.path}</code>{step.lines ? ` : ${step.lines}` : ''}</> : 'snippet'}
          </span>
          <span className="wt-actions">
            {step.path && (
              <button className="wt-btn" onClick={copyPath} aria-label="Copy path">
                <Icon name="FileCode" size={13} /> {copied ? 'Copied' : 'Copy path'}
              </button>
            )}
            {href && (
              <a className="wt-btn" href={href} target="_blank" rel="noopener noreferrer"><Icon name="ArrowRight" size={13} /> Open file</a>
            )}
            {stepped && (
              <span className="wt-nav">
                <button className="wt-btn" disabled={i === 0} onClick={() => setI((v) => v - 1)} aria-label="Previous step"><Icon name="ChevronLeft" size={15} /></button>
                <span className="muted">{i + 1} / {steps.length}</span>
                <button className="wt-btn" disabled={i === steps.length - 1} onClick={() => setI((v) => v + 1)} aria-label="Next step"><Icon name="ChevronRight" size={15} /></button>
              </span>
            )}
          </span>
        </div>
        <CodeBlock code={step.code} highlight={step.highlight} />
      </div>
      {step.note && <Markdown className="muted" text={step.note} />}
      {(step.inputs || step.outputs || step.deps || step.failure) && (
        <dl className="wt-meta">
          <Facts label="Inputs" items={step.inputs} />
          <Facts label="Outputs" items={step.outputs} />
          <Facts label="Depends on" items={step.deps} />
          <Facts label="Failure paths" items={step.failure} />
        </dl>
      )}
    </div>
  );
}
