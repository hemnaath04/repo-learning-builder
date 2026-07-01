// Deterministic desktop preset for the learning atlas. Positions and visual
// variants come from this preset (never generated); titles, minutes, and status
// come from existing course data. Coordinates live in a fixed 980x600 stage so
// the SVG path and the landmark cards always align, then the stage scales to fit.

import type { Course, Module } from './schema';
import type { Progress } from './progress';
import { moduleCompleted } from './navigation';

export const STAGE_W = 980;
export const STAGE_H = 600;
export const PATH_TOP = 62;

export type LandmarkVariant = 'story' | 'problem' | 'journey' | 'toolbox' | 'architecture' | 'build';

export interface PresetSlot { left: number; top: number; width: number; height: number; variant: LandmarkVariant; tag?: string }

// The six-position preset, exactly per the handoff spec.
export const PRESET: PresetSlot[] = [
  { left: 44, top: 132, width: 216, height: 126, variant: 'story', tag: 'Start here' },
  { left: 310, top: 88, width: 196, height: 112, variant: 'problem' },
  { left: 575, top: 160, width: 210, height: 122, variant: 'journey', tag: 'Visual' },
  { left: 725, top: 355, width: 190, height: 116, variant: 'toolbox' },
  { left: 455, top: 455, width: 214, height: 118, variant: 'architecture', tag: 'Deep dive' },
  { left: 86, top: 398, width: 224, height: 122, variant: 'build', tag: 'Challenge' },
];

export type LandmarkStatus = 'ready' | 'current' | 'completed' | 'locked';

export interface Landmark {
  id: string;
  moduleId: string;
  order: number;
  variant: LandmarkVariant;
  tag?: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: LandmarkStatus;
  lessonIds: string[];
  slot: PresetSlot;
}

function moduleMinutes(m: Module): number {
  return m.lessons.reduce((n, l) => n + (l.est ?? 6), 0);
}

/** Map the course's modules onto the deterministic preset (first 6 shown). */
export function landmarksFor(course: Course, progress: Progress | null): Landmark[] {
  const currentIdx = course.modules.findIndex((m) => !progress || !moduleCompleted(course, m.id, progress));
  return course.modules.slice(0, PRESET.length).map((m, i) => {
    const slot = PRESET[i];
    const done = progress ? moduleCompleted(course, m.id, progress) : false;
    const status: LandmarkStatus = done ? 'completed' : i === currentIdx ? 'current' : 'ready';
    return {
      id: m.id,
      moduleId: m.id,
      order: i + 1,
      variant: slot.variant,
      tag: slot.tag,
      title: m.title,
      description: m.summary ?? '',
      estimatedMinutes: moduleMinutes(m),
      status,
      lessonIds: m.lessons.map((l) => l.id),
      slot,
    };
  });
}

/** Centre point of a landmark card, in stage coordinates. */
export function centerOf(slot: PresetSlot): { x: number; y: number } {
  return { x: slot.left + slot.width / 2, y: slot.top + slot.height / 2 };
}

/** Initials for the course mark (e.g. "Understanding ClaimFarm" -> "CF"). */
export function courseInitials(title: string): string {
  const stop = new Set(['understanding', 'how', 'the', 'a', 'an', 'learn', 'intro', 'to', 'of', 'your']);
  const words = title.split(/\s+/).filter((w) => w && !stop.has(w.toLowerCase()));
  const base = words.length ? words : title.split(/\s+/);
  const caps = base.join('').match(/[A-Z]/g);
  if (caps && caps.length >= 2) return (caps[0] + caps[1]).toUpperCase();
  return base.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || title.slice(0, 2).toUpperCase();
}
