export const TIERS = {
  high: { particles: 9000, dpr: [1, 1.75], buffer: 1024, samples: 6, reflector: 1024, shadows: true, fragments: 7, bloom: true, shards: 90 },
  mid: { particles: 5200, dpr: [1, 1.5], buffer: 512, samples: 4, reflector: 512, shadows: false, fragments: 5, bloom: true, shards: 64 },
  low: { particles: 2600, dpr: [1, 1.25], buffer: 384, samples: 3, reflector: 0, shadows: false, fragments: 3, bloom: false, shards: 40 },
};

export function detectDevice() {
  const mq = (q) => window.matchMedia(q).matches;
  const reducedMotion = mq("(prefers-reduced-motion: reduce)");
  const coarse = mq("(pointer: coarse)");
  const width = window.innerWidth;
  const mobile = width < 768;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;

  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webgl = false;
  }

  let tier = "high";
  if (mobile || (coarse && width < 1200) || cores <= 4 || memory <= 4) tier = "mid";
  if (mobile && (cores <= 4 || memory <= 3)) tier = "low";

  return { reducedMotion, coarse, mobile, webgl, tier };
}
