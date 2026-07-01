import type { Landmark } from '../lib/landmarks';
import { Icon } from './Icon';

// One reusable landmark card. Variant, position, and size come from the preset;
// all text comes from course data. Keyboard operable with aria-current.
export function LandmarkNode({ landmark, selected, onSelect }: { landmark: Landmark; selected: boolean; onSelect: () => void }) {
  const { slot, order, tag, title, description, estimatedMinutes, status } = landmark;
  const num = String(order).padStart(2, '0');
  const eyebrow = tag ? `${num} · ${tag}` : num;
  return (
    <button
      type="button"
      className={`landmark v-${slot.variant}${selected ? ' selected' : ''} st-${status}`}
      aria-current={selected ? 'true' : undefined}
      aria-label={`Landmark ${order}: ${title}, ${estimatedMinutes} minutes, ${status}`}
      onClick={onSelect}
      style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height, animationDelay: `${order * 70}ms` }}
    >
      <span className="lm-top">
        <span className="lm-eyebrow">{eyebrow}</span>
        <span className="lm-min">
          {status === 'completed' ? <Icon name="Check" size={13} /> : null}
          {estimatedMinutes} min
        </span>
      </span>
      <span className="lm-title">{title}</span>
      {description && <span className="lm-sub">{description}</span>}
    </button>
  );
}
