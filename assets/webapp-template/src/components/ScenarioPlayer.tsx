import { useState } from 'react';
import type { Scenario } from '../lib/schema';
import { Markdown } from './Markdown';
import { Icon } from './Icon';

// What-if explorer: pick an input, watch what the system does with it.
// Steps reveal with a small stagger (pure CSS) so it reads as a live run.
export function ScenarioPlayer({ data }: { data: Scenario }) {
  const [choice, setChoice] = useState<number | null>(null);
  const active = choice !== null ? data.choices[choice] : null;

  return (
    <div className="scenario">
      <p className="scenario-prompt"><Markdown text={data.prompt} /></p>

      <div className="scenario-choices" role="group" aria-label="Scenario inputs">
        {data.choices.map((c, i) => (
          <button
            key={i}
            className={`scenario-choice${choice === i ? ' active' : ''}`}
            onClick={() => setChoice(i)}
            aria-pressed={choice === i}
          >
            <Icon name="MousePointerClick" size={14} /> {c.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="scenario-run" key={choice} aria-live="polite">
          <ol className="scenario-steps">
            {active.steps.map((s, i) => (
              <li key={i} style={{ animationDelay: `${i * 140}ms` }}>
                <span className="ss-num">{i + 1}</span>
                <Markdown text={s} />
              </li>
            ))}
          </ol>
          <div className="scenario-outcome" style={{ animationDelay: `${active.steps.length * 140}ms` }}>
            <Icon name="ArrowRight" size={15} /> <Markdown text={active.outcome} />
          </div>
          <button className="btn ghost" onClick={() => setChoice(null)}>
            <Icon name="RotateCcw" size={15} /> Try another input
          </button>
        </div>
      )}
    </div>
  );
}
