import type { FlowStep } from '../lib/schema';
import { Markdown } from './Markdown';

export function FlowSteps({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="flowsteps">
      {steps.map((s, i) => (
        <li key={i} className="flowstep">
          <span className="fs-num">{i + 1}</span>
          <div>
            <span className="fs-actor">{s.actor}</span> {s.action}
            {s.note && <Markdown className="muted" text={s.note} />}
          </div>
        </li>
      ))}
    </ol>
  );
}
