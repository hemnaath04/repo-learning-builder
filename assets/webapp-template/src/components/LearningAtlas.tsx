import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { landmarksFor, STAGE_W, STAGE_H } from '../lib/landmarks';
import { CourseIdentityStrip } from './CourseIdentityStrip';
import { LandmarkNode } from './LandmarkNode';
import { LearningPath } from './LearningPath';
import { LessonDock } from './LessonDock';
import { MobileJourney } from './MobileJourney';
import { Icon } from './Icon';

// Estimate the stage fit from the viewport for a correct first paint.
function estimateFit(): number {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const tablet = w <= 1023;
  const pageInner = Math.min(1440, w) - 56; // atlas-page horizontal padding
  const mapW = tablet ? pageInner : pageInner - 326 - 20; // minus dock + gap
  return Math.max(0.5, Math.min(1, (mapW - 40) / STAGE_W));
}

export function LearningAtlas() {
  const { course, progress } = useApp();
  const landmarks = useMemo(() => (course ? landmarksFor(course, progress) : []), [course, progress]);
  const total = course?.modules.length ?? 0;

  const current = landmarks.find((l) => l.status === 'current') ?? landmarks[0];
  const [selectedId, setSelectedId] = useState<string | null>(current?.moduleId ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const selected = landmarks.find((l) => l.moduleId === selectedId) ?? current ?? null;
  const selectedModule = course?.modules.find((m) => m.id === selected?.moduleId) ?? null;

  // Fit the fixed 980x600 stage into the flexible map field, with a zoom control.
  // The initial value is derived from the viewport so the very first paint is
  // already scaled (no dependency on the async ResizeObserver); the observer
  // then refines against the real element width.
  const mapRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(() => estimateFit());
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const measure = () => setFit(Math.max(0.5, Math.min(1, (el.clientWidth - 40) / STAGE_W)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1.2, fit * zoom);

  useEffect(() => { setSelectedId(current?.moduleId ?? null); }, [current?.moduleId]);

  if (!course || !progress || !selected) return null;

  return (
    <div className="atlas-page reveal">
      <CourseIdentityStrip />

      <div className="atlas-wrap">
        <div className="atlas" role="group" aria-label="Learning atlas" ref={mapRef}>
          <div className="map-controls">
            <div className="mc-left">
              <span className="mc-title">Your route through the repository</span>
              <span className="mc-badge">{landmarks.length} of {total} shown</span>
            </div>
            <div className="mc-zoom" role="group" aria-label="Zoom">
              <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))} aria-label="Zoom out"><Icon name="Minus" size={15} /></button>
              <button onClick={() => setZoom(1)} aria-label="Fit">Fit</button>
              <button onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))} aria-label="Zoom in"><Icon name="Plus" size={15} /></button>
            </div>
          </div>

          <div className="atlas-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
            <LearningPath shown={landmarks.length} />
            {landmarks.map((lm) => (
              <LandmarkNode key={lm.id} landmark={lm} selected={selected.moduleId === lm.moduleId} onSelect={() => setSelectedId(lm.moduleId)} />
            ))}
          </div>
        </div>

        <div className="desktop-dock">
          <LessonDock landmark={selected} module={selectedModule} />
        </div>
      </div>

      <MobileJourney modules={course.modules} onOpen={(id) => { setSelectedId(id); setSheetOpen(true); }} />

      {sheetOpen && (
        <>
          <div className="sheet-scrim" onClick={() => setSheetOpen(false)} aria-hidden />
          <div className="sheet open" role="dialog" aria-label="Lessons">
            <LessonDock landmark={selected} module={selectedModule} onNavigate={() => setSheetOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
