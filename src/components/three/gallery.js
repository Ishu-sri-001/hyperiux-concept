import * as THREE from "three";

/**
 * Work gallery layout (world units).
 * Frames stand on a shallow arc facing a common centre in front of the old H
 * position; the camera glides along the arc, always framing one project.
 * Varied depth, height, size and yaw keep it from reading as a grid.
 */
const CENTER = new THREE.Vector3(0, 0, 8);
const RADIUS = 15;
const SPREAD = 0.62; // half-angle of the arc (rad)
const BASE_W = 5.2;
const BASE_H = 3.25;
const DEPTH = [-0.6, 1.4, -0.2, 1.1, -0.8, 0.9, -0.3, 1.2];
const LIFT = [0.15, -0.25, 0.35, -0.1, 0.25, -0.3, 0.1, -0.2];
const YAW = [0.08, -0.06, 0.05, -0.08, 0.06, -0.04, 0.07, -0.05];
const SCALE = [1, 0.88, 1.08, 0.92, 1.02, 0.9, 1.05, 0.94];
export const FRAME_Y = 3.1;

const angleAt = (s, n) => (n < 2 ? 0 : THREE.MathUtils.lerp(-SPREAD, SPREAD, s / (n - 1)));

/** Transform of frame i of n. */
export function frameTransform(i, n) {
  const a = angleAt(i, n);
  const r = RADIUS + DEPTH[i % DEPTH.length];
  const scale = SCALE[i % SCALE.length];
  return {
    position: new THREE.Vector3(CENTER.x + Math.sin(a) * r, FRAME_Y + LIFT[i % LIFT.length], CENTER.z - Math.cos(a) * r),
    rotationY: -a + YAW[i % YAW.length],
    w: BASE_W * scale,
    h: BASE_H * scale,
  };
}

/** Point on the border of frame `f` at perimeter parameter u ∈ [0,1), in world space. */
export function framePerimeterPoint(f, u, inset = 0, out = new THREE.Vector3()) {
  const w = f.w + 0.3 - inset;
  const h = f.h + 0.3 - inset;
  const per = 2 * (w + h);
  let d = (((u % 1) + 1) % 1) * per;
  let x;
  let y;
  if (d < w) [x, y] = [-w / 2 + d, h / 2];
  else if ((d -= w) < h) [x, y] = [w / 2, h / 2 - d];
  else if ((d -= h) < w) [x, y] = [w / 2 - d, -h / 2];
  else [x, y] = [-w / 2, -h / 2 + (d - w)];
  out.set(x, y, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.rotationY).add(f.position);
  return out;
}

/**
 * Camera for a continuous gallery position s (0 … n-1): in front of the
 * interpolated frame, looking straight at it. `distance` adapts to the viewport.
 */
export function galleryCamera(s, n, distance, outPos, outLook) {
  const i0 = Math.floor(THREE.MathUtils.clamp(s, 0, n - 1));
  const i1 = Math.min(n - 1, i0 + 1);
  const t = THREE.MathUtils.clamp(s - i0, 0, 1);
  const f0 = frameTransform(i0, n);
  const f1 = frameTransform(i1, n);
  outLook.lerpVectors(f0.position, f1.position, t);
  const a = angleAt(s, n);
  // Direction from the frame back toward the arc centre.
  outPos.set(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(distance).add(outLook);
  outPos.y = outLook.y - 0.35;
  return { pos: outPos, look: outLook };
}

// ---------------------------------------------------------------------------
// Frame formation: the border is four glass bars drawn clockwise from the
// top-left corner. Shards fly in and land exactly where the border is growing.
// ---------------------------------------------------------------------------
export const BAR = 0.12;
export const BAR_DEPTH = 0.14;

/** Timing on the Work entry progress W (0 → 1). */
export const FORM = { start: 0.28, span: 0.42, stagger: 0.035, flight: 0.24, fade: 0.07 };

/** How far frame i's border has grown (0 → 1) at entry progress W. */
export const frameGrow = (i, W) => THREE.MathUtils.clamp((W - FORM.start - i * FORM.stagger) / FORM.span, 0, 1);
/** When the shard landing at perimeter position u of frame i arrives. */
export const arrivalAt = (i, u) => FORM.start + i * FORM.stagger + u * FORM.span;
/** Project content fades in once the border has closed. */
export const contentVisible = (i, W) =>
  THREE.MathUtils.clamp((W - (FORM.start + i * FORM.stagger + FORM.span)) / FORM.fade, 0, 1);

/** The four bars of a frame (frame-local): start point, direction angle, length, path offset. */
export function frameBars(f) {
  const { w, h } = f;
  const b = BAR;
  const bars = [
    { start: [-w / 2 - b, h / 2 + b / 2], rot: 0, len: w + 2 * b },
    { start: [w / 2 + b / 2, h / 2 + b], rot: -Math.PI / 2, len: h + 2 * b },
    { start: [w / 2 + b, -h / 2 - b / 2], rot: Math.PI, len: w + 2 * b },
    { start: [-w / 2 - b / 2, -h / 2 - b], rot: Math.PI / 2, len: h + 2 * b },
  ];
  let acc = 0;
  bars.forEach((bar) => {
    bar.offset = acc;
    acc += bar.len;
  });
  return { bars, total: acc };
}

/** Point on the border centre line at path position u ∈ [0, 1] (frame-local). */
export function frameLocalPoint(f, u, out = new THREE.Vector3()) {
  const { bars, total } = frameBars(f);
  let d = THREE.MathUtils.clamp(u, 0, 1) * total;
  for (let k = 0; k < bars.length; k++) {
    const bar = bars[k];
    if (d <= bar.len || k === bars.length - 1) {
      const t = Math.min(d, bar.len);
      return out.set(bar.start[0] + Math.cos(bar.rot) * t, bar.start[1] + Math.sin(bar.rot) * t, 0);
    }
    d -= bar.len;
  }
  return out;
}

const UP = new THREE.Vector3(0, 1, 0);
/** Same point in world space (for the frame at rest). */
export function frameWorldPoint(f, u, out = new THREE.Vector3()) {
  return frameLocalPoint(f, u, out).applyAxisAngle(UP, f.rotationY).add(f.position);
}
