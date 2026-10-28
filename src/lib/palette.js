import * as THREE from "three";

/**
 * Accent palettes. Gold is the default; "orange" swaps every warm accent for the
 * Hyperiux brand orange (#ff5f00, as used on hyperiux.com).
 * Each entry: [gold, orange]. Scene code crossfades by store.accentMix (0 → 1).
 */
export const ACCENT = {
  seamHot: ["#f2a24c", "#ff7a14"], // glowing cracks, crystal heat (lifted so the glow reads as #ff5f00, not red)
  filament: ["#f0d3a2", "#ffb48a"], // light running through the inner filaments
  particle: ["#f2d29c", "#ff8a3d"], // small floating circles
  particleDeep: ["#8c6735", "#a8410a"],
  wire: ["#efe3cf", "#f6d2bd"], // chrome orbit wires
  core: ["#5c4934", "#ff7024"], // inner metal core: smoky bronze ↔ polished Hyperiux orange
  crystalTint: ["#efe0c6", "#f7e2cf"], // crystal attenuation
  sphereTint: ["#e2c08c", "#f2a57a"], // crystal balls
  edge: ["#8f7a5c", "#8f6552"],
  edgeHot: ["#d7a35f", "#ff7a1a"],
  frameEdge: ["#9a8466", "#9a6f5c"],
  light: ["#ffd29a", "#ffab73"], // warm back light / cursor light
  envSun: ["#ffd9a6", "#ffc29c"], // reflections: low sun
  envStrip: ["#e8b77a", "#ff8a3d"], // reflections: accent strips
  envStrip2: ["#e3ae6c", "#ff7a2a"],
};

const cache = {};
/** Mix an accent entry (cached Color objects, so this is cheap per frame). */
export function accentColor(key, mix, out) {
  if (!cache[key]) cache[key] = ACCENT[key].map((c) => new THREE.Color(c));
  const [a, b] = cache[key];
  return out.lerpColors(a, b, mix);
}

export const accentHex = (key, accent) => ACCENT[key][accent === "orange" ? 1 : 0];
