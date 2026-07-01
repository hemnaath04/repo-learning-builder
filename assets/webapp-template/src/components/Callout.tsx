import type { Callout as CalloutData, CalloutKind } from '../lib/schema';
import { Icon } from './Icon';
import { Markdown } from './Markdown';

const META: Record<CalloutKind, { label: string; icon: string }> = {
  example: { label: 'Example', icon: 'Sparkles' },
  analogy: { label: 'Analogy', icon: 'Quote' },
  insight: { label: 'Insight', icon: 'Lightbulb' },
  warning: { label: 'Watch out', icon: 'TriangleAlert' },
};

export function Callout({ data }: { data: CalloutData }) {
  const m = META[data.kind];
  return (
    <aside className={`callout ${data.kind}`}>
      <span className="co-icon">
        <Icon name={m.icon} size={18} />
      </span>
      <div className="co-body">
        <div className="co-kind">{m.label}</div>
        <Markdown text={data.body} />
      </div>
    </aside>
  );
}
