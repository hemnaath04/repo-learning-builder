import type { Tech } from '../lib/schema';
import { Icon } from './Icon';

export function TechCards({ tech }: { tech: Tech[] }) {
  return (
    <div className="techgrid">
      {tech.map((t) => (
        <div key={t.id} className="techcard">
          <h4>
            <Icon name="Cpu" size={16} /> {t.name}
          </h4>
          {t.purpose && <p className="muted">{t.purpose}</p>}
          <dl>
            {t.location && (
              <>
                <dt>Where</dt>
                <dd>
                  <code>{t.location}</code>
                </dd>
              </>
            )}
            {t.alternatives && (
              <>
                <dt>Alternatives</dt>
                <dd>{t.alternatives}</dd>
              </>
            )}
            {t.tradeoffs && (
              <>
                <dt>Tradeoffs</dt>
                <dd>{t.tradeoffs}</dd>
              </>
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}
