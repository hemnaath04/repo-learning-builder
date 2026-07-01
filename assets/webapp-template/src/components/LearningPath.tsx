import { PRESET, centerOf, PATH_TOP, STAGE_W, STAGE_H } from '../lib/landmarks';

// The connected learning path, drawn through the preset landmark centres in the
// fixed 980x600 stage coordinate space so it aligns with the cards exactly.
export function LearningPath({ shown }: { shown: number }) {
  const pts = PRESET.slice(0, shown).map((s) => centerOf(s));
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y - PATH_TOP}`).join(' ');
  const h = STAGE_H - PATH_TOP;
  return (
    <svg
      className="atlas-path-svg"
      viewBox={`0 0 ${STAGE_W} ${h}`}
      width={STAGE_W}
      height={h}
      fill="none"
      aria-hidden
      style={{ position: 'absolute', left: 0, top: PATH_TOP }}
    >
      <path className="atlas-path" d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
