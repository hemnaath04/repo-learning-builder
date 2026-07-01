import { useState } from 'react';
import type { WalkthroughStep } from '../lib/schema';
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

export function CodeWalkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const [i, setI] = useState(0);
  const stepped = steps.length > 1;
  const step = steps[i];

  return (
    <div className="walkthrough">
      <div className="wt-step">
        <div className="wt-head">
          <span className="wt-file">
            {step.path ? (
              <>
                <code>{step.path}</code>
                {step.lines ? ` : ${step.lines}` : ''}
              </>
            ) : (
              'snippet'
            )}
          </span>
          {stepped && (
            <span className="wt-nav">
              <button className="btn ghost" disabled={i === 0} onClick={() => setI((v) => v - 1)} aria-label="Previous step">
                <Icon name="ChevronLeft" size={16} />
              </button>
              <span className="muted">
                {i + 1} / {steps.length}
              </span>
              <button className="btn ghost" disabled={i === steps.length - 1} onClick={() => setI((v) => v + 1)} aria-label="Next step">
                <Icon name="ChevronRight" size={16} />
              </button>
            </span>
          )}
        </div>
        <CodeBlock code={step.code} highlight={step.highlight} />
      </div>
      {step.note && <Markdown className="muted" text={step.note} />}
    </div>
  );
}
