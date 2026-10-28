/**
 * Shared, mutable scene state.
 * The DOM layer (GSAP, ScrollTrigger, pointer listeners) writes here,
 * the WebGL layer reads it inside useFrame. No React re-renders per frame.
 */
/** Pointer / click interaction with the 3D scene. Switched off for now. */
export const INTERACTIVE = false;

/** Hero headline, copy and CTA. Switched off for now: only the HYPERIUX wordmark shows. */
export const HERO_COPY = false;

/** Visible text in the sections after the hero (Services, Work). Off for now; icons and screen-reader text remain. */
export const SECTION_COPY = false;

/** Cursor pushes the shards of the exploded H around (ice-block hover). Hero H stays still. */
export const SHARD_HOVER = true;

export const store = {
  /** 0 → 1 opening assembly (Genesis). */
  genesis: 0,
  /** 0 → 1 hero exit progress, driven by scroll. */
  hero: 0,
  /** Normalised device coords of the pointer, plus speed for wave triggers. */
  pointer: { x: 0, y: 0, speed: 0, active: false, lastMove: 0 },
  /** 0 → 1 the H's pieces settle into the four service formations. */
  services: 0,
  /** Hovered / selected service (-1 when none). */
  serviceHover: -1,
  serviceFocus: -1,
  /** Screen position (px) of each formation, for the HTML connector lines. */
  formations: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  /** Work gallery: 0 → 1 shards become frames; 0 → 1 travel through the gallery. */
  workIn: 0,
  work: 0,
  workHover: -1,
  workOpen: -1,
  /** Screen position of each frame's label anchor. */
  frames: [],
  /** Accent colour: "gold" (default) or "orange" (Hyperiux brand). accentMix crossfades 0 → 1. */
  accent: "gold",
  accentMix: 0,
  /** Index of the hovered nav item, -1 when none. */
  navHover: -1,
  /** Click / fast-move impulses in H-local coordinates. */
  pulses: [],
  /** Last time light was sent through the filaments. */
  lightAt: -10,
  reducedMotion: false,
  tier: "high",
  mobile: false,
  ready: false,
};

export const now = () => performance.now() / 1000;

export function addPulse(point, strength = 1) {
  store.pulses.push({ point: point.clone(), time: now(), strength });
  if (store.pulses.length > 4) store.pulses.shift();
}

export function sendLight() {
  store.lightAt = now();
}

const listeners = new Map();
export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}
export function emit(type, payload) {
  listeners.get(type)?.forEach((fn) => fn(payload));
}
