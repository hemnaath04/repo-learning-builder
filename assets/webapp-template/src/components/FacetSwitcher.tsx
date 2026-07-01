import { useState } from 'react';
import type { Facet } from '../lib/schema';
import { Markdown } from './Markdown';

// The concept switcher: What / Why / How / What if, as tabs instead of a long
// definition list. Labels come from the lesson archetype, not the course data.
export function FacetSwitcher({ facets }: { facets: Facet[] }) {
  const [active, setActive] = useState(0);
  const current = facets[active] ?? facets[0];
  return (
    <div className="facets">
      <div className="facet-tabs" role="tablist" aria-label="Concept facets">
        {facets.map((f, i) => (
          <button
            key={f.key}
            role="tab"
            id={`facet-tab-${f.key}`}
            aria-selected={i === active}
            aria-controls={`facet-panel-${f.key}`}
            className="facet-tab"
            onClick={() => setActive(i)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div
        className="facet-body"
        role="tabpanel"
        id={`facet-panel-${current.key}`}
        aria-labelledby={`facet-tab-${current.key}`}
      >
        <Markdown text={current.body} />
      </div>
    </div>
  );
}
