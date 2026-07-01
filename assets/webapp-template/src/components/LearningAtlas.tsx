import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { landmarksFor, routeLabel, STAGE_W, STAGE_H } from '../lib/landmarks';
import { CourseIdentityStrip } from './CourseIdentityStrip';
import { LandmarkNode } from './LandmarkNode';
import { LearningPath } from './LearningPath';
import { LessonDock } from './LessonDock';
import { MobileJourney } from './MobileJourney';
import { Icon } from './Icon';

function estimateFit(): number {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const tablet = w <= 1023;
  const pageInner = Math.min(1440, w) - 56;
  const mapW = tablet ? pageInner : pageInner - 326 - 20;
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

  const mapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
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

  const closeSheet = () => {
    setSheetOpen(false);
    triggerRef.current?.focus();
  };

  // While the sheet is open: lock scroll, focus it, trap Tab, close on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sheet = sheetRef.current;
    const focusables = () => sheet ? Array.from(sheet.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter((e) => !e.hasAttribute('disabled')) : [];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
      if (e.key === 'Tab' && sheet) {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  if (!course || !progress || !selected) return null;

  const openSheet = (id: string) => {
    triggerRef.current = (typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null);
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <div className="atlas-page reveal">
      <CourseIdentityStrip />

      <div className="atlas-wrap">
        <div className="atlas" role="group" aria-label="Learning atlas" ref={mapRef}>
          <div className="map-controls">
            <div className="mc-left">
              <span className="mc-title">{routeLabel(course.meta.sourceType)}</span>
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

      <MobileJourney modules={course.modules} onOpen={openSheet} />

      {sheetOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="sheet-scrim" onClick={closeSheet} aria-hidden />
          <div className="sheet open" role="dialog" aria-modal="true" aria-label={`${selected.title} lessons`} ref={sheetRef}>
            <button className="sheet-close" onClick={closeSheet} aria-label="Close">
              <Icon name="X" size={18} />
            </button>
            <LessonDock landmark={selected} module={selectedModule} onNavigate={() => setSheetOpen(false)} />
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
