import * as THREE from "three";

/**
 * Smooth, flowing ripple normal map (mostly vertical streaks) so the crystal
 * refracts like poured glass. Tileable, deterministic, generated once.
 */
let cached = null;

export function getFacetMaps(size = 256) {
  if (cached) return cached;

  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Integer frequencies keep it seamless; small vertical frequencies make long streaks.
  const waves = Array.from({ length: 9 }, (_, i) => ({
    kx: 1 + Math.floor(rnd() * 4),
    ky: Math.floor(rnd() * 2),
    a: 0.55 / (1 + i * 0.35),
    p: rnd() * Math.PI * 2,
  }));
  const TAU = Math.PI * 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let dx = 0;
      let dy = 0;
      for (const w of waves) {
        const c = Math.cos(TAU * (w.kx * u + w.ky * v) + w.p) * w.a * TAU;
        dx += c * w.kx;
        dy += c * w.ky;
      }
      const s = 0.045;
      const nx = -dx * s;
      const ny = -dy * s;
      const len = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      img.data[i] = (nx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const normal = new THREE.CanvasTexture(canvas);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.colorSpace = THREE.NoColorSpace;
  normal.anisotropy = 4;

  cached = { normal };
  return cached;
}
