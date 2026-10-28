import * as THREE from "three";

/**
 * Orbital glass ribbons that sweep around and through the H (model units).
 * The same ellipses are used for the ribbon tubes and for the gold particle
 * trails, so the particles always ride on the ribbons.
 */
export const RIBBONS = [
  { rx: 12.5, ry: 5.2, rot: [1.2, 0.25, 0.3] },
  { rx: 11, ry: 6.8, rot: [0.95, -0.55, -0.4] },
  { rx: 9.2, ry: 3.8, rot: [1.42, 0.85, 0.5] },
  { rx: 14.2, ry: 9.5, rot: [0.38, 0.35, -0.22] },
];

/** Base orientation of each ring (Matrix4). */
export const ribbonBase = () => RIBBONS.map((r) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.rot)));

/**
 * How each ring turns as the page scrolls: its own axis, direction and speed
 * (radians per unit of hero scroll), so the set moves like a gyroscope.
 */
export const RING_SPIN = [
  { axis: new THREE.Vector3(0, 1, 0), speed: 2.6 },
  { axis: new THREE.Vector3(1, 0.2, 0).normalize(), speed: -2.1 },
  { axis: new THREE.Vector3(0.5, 0.85, 0.15).normalize(), speed: 3.2 },
  { axis: new THREE.Vector3(0.1, 0.35, 1).normalize(), speed: -1.7 },
];

export const ribbonMatrices = () =>
  RIBBONS.map((r) => new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.rot))));

export function ribbonCurve(r) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.rot));
  const pts = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r.rx, Math.sin(a) * r.ry, 0).applyMatrix4(m));
  }
  return new THREE.CatmullRomCurve3(pts, true, "centripetal");
}
