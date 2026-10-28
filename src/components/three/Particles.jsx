"use client";
"use no memo";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { RIBBONS, ribbonMatrices } from "./ribbons";

/** Small deterministic PRNG so the particle field is identical every load. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Particle roles
const BODY = 0;
const FILAMENT = 1;
const ORBIT = 2;
const DUST = 3;

function buildField(model, count) {
  const rng = mulberry32(20260415);
  const { source, pieces, filaments, columns, size } = model;
  const halfH = size.y / 2;

  const position = new Float32Array(count * 3);
  const start = new Float32Array(count * 3);
  const expand = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const info = new Float32Array(count * 4);
  const meta = new Float32Array(count * 3);

  const sampler = new MeshSurfaceSampler(new THREE.Mesh(source)).setRandomGenerator(rng).build();
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  // Piece index (see PIECES): 0 bodyL, 1 pillarA, 2 pillarB, 3 bodyR, 4 free-floating.
  const boxA = pieces.pillarA.box.clone().expandByScalar(0.05);
  const boxB = pieces.pillarB.box.clone().expandByScalar(0.05);
  const pieceOf = (v) => (boxA.containsPoint(v) ? 1 : boxB.containsPoint(v) ? 2 : v.x < model.cut ? 0 : 3);

  const span = (columns.right - columns.left) / 2;
  // Genesis order: legs build bottom-up first, then the bridge streams inward to the cube.
  const delayFor = (v) => {
    const dl = Math.abs(v.x - columns.left);
    const dr = Math.abs(v.x - columns.right);
    const nearest = Math.min(dl, dr);
    if (nearest < 1.35) return 0.04 + 0.4 * ((v.y + halfH) / size.y) + rng() * 0.05;
    return 0.5 + 0.42 * (1 - Math.min(1, nearest / span)) + rng() * 0.06;
  };


  // Most particles only build the H during the opening (then fade into the glass).
  // Afterwards just a few small circles remain, riding the wires or drifting.
  const nOrbit = Math.max(60, Math.round(count * 0.013));
  const nDust = Math.max(40, Math.round(count * 0.01));
  const nBuild = count - nOrbit - nDust;
  const nBody = Math.floor(nBuild * 0.75);
  const nFil = nBuild - nBody;

  for (let i = 0; i < count; i++) {
    let type;
    if (i < nBody) type = BODY;
    else if (i < nBody + nFil) type = FILAMENT;
    else if (i < nBody + nFil + nOrbit) type = ORBIT;
    else type = DUST;

    let radius = 0;
    let tilt = 0;
    let delay;

    if (type === BODY) {
      sampler.sample(p, n);
      // Most particles live inside the glass volume; a few trace its skin.
      if (rng() < 0.82) p.z *= rng() * 0.85;
      delay = delayFor(p);
    } else if (type === FILAMENT) {
      const f = filaments[Math.floor(rng() * filaments.length)];
      const offset = f.piece === "body" ? pieces.body.offset : pieces[f.piece].offset;
      f.curve.getPointAt(rng(), p).add(offset);
      p.x += (rng() - 0.5) * 0.45;
      p.y += (rng() - 0.5) * 0.45;
      p.z += (rng() - 0.5) * 0.9;
      delay = delayFor(p);
    } else if (type === ORBIT) {
      // Ride one of the glass ribbons; `radius` stores the ribbon index, `tilt` a small spread.
      p.set(0, 0, 0);
      radius = Math.floor(rng() * RIBBONS.length);
      tilt = Math.pow(rng(), 2) * 0.9;
      delay = 0.55 + rng() * 0.4;
    } else {
      // Atmospheric dust: a wide, shallow volume around the sculpture.
      p.set((rng() - 0.5) * 64, -halfH - 3 + rng() * 34, -16 + rng() * 28);
      delay = 0.2 + rng() * 0.7;
    }

    p.toArray(position, i * 3);

    // Genesis start: far shell; first particle is the seed, the next few orbit it.
    const early = i === 0 ? 1 : i <= 14 ? 2 : 0;
    if (early === 1) {
      start.set([0, 0, 0], i * 3);
    } else {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 18 + rng() * 26;
      start.set(
        [r * Math.sin(phi) * Math.cos(theta), (r * Math.cos(phi)) * 0.6 + 2, r * Math.sin(phi) * Math.sin(theta) * 0.7],
        i * 3
      );
    }

    // Scroll exit: the field opens outward around the sculpture (kept clear of the camera).
    if (type === ORBIT || type === DUST) {
      const th = rng() * Math.PI * 2;
      const r = 13 + rng() * 15;
      expand.set([Math.cos(th) * r, (rng() - 0.45) * 22, Math.sin(th) * r * 0.6 - 4], i * 3);
    } else {
      const s = 1.5 + rng() * 2.1;
      expand.set([p.x * s + (rng() - 0.5) * 9, p.y * (1.15 + rng() * 0.9) + (rng() - 0.5) * 6, p.z + (rng() - 0.6) * 18], i * 3);
    }

    const gold = rng() < (type === ORBIT ? 0.75 : type === FILAMENT ? 0.5 : type === DUST ? 0.12 : 0.22) ? 1 : 0;
    const sizeR = rng();
    rand.set(
      [
        early === 1 ? 1.2 : type === DUST ? 0.07 + Math.pow(sizeR, 2) * 0.08 : type === ORBIT ? 0.09 + Math.pow(sizeR, 2) * 0.1 : 0.1 + Math.pow(sizeR, 5) * 0.42,
        rng() * Math.PI * 2,
        0.25 + rng() * 0.75,
        gold,
      ],
      i * 4
    );
    info.set([type, Math.min(delay, 1), radius, tilt], i * 4);
    meta.set([early, type >= ORBIT ? 4 : pieceOf(p), rng()], i * 3);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position, 3));
  g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  g.setAttribute("aExpand", new THREE.BufferAttribute(expand, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
  g.setAttribute("aInfo", new THREE.BufferAttribute(info, 4));
  g.setAttribute("aMeta", new THREE.BufferAttribute(meta, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);
  return g;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uGenesis;
  uniform float uExpand;
  uniform float uBoost;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSweep;
  uniform vec3 uMouse;
  uniform float uMouseStr;
  uniform float uMouseRepel;
  uniform vec4 uPulses[4];
  uniform float uPulseStr[4];
  uniform mat4 uPieceM[5];
  uniform float uFlowP[5];
  uniform float uExpandBody;
  uniform float uBuildVis;
  uniform mat3 uRibRot[4];
  uniform vec2 uRibR[4];

  attribute vec3 aStart;
  attribute vec3 aExpand;
  attribute vec4 aRand;
  attribute vec4 aInfo;
  attribute vec3 aMeta;

  varying float vAlpha;
  varying float vGold;
  varying float vGlint;
  varying float vTone;

  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float type = aInfo.x;
    float delay = aInfo.y;
    float early = aMeta.x;
    float piece = aMeta.y;
    float seed = aMeta.z;
    float phase = aRand.y;
    float speed = aRand.z;

    int pi = int(piece + 0.5);

    // ---- Idle formation ------------------------------------------------
    vec3 target = position;
    if (type < 0.5 || (type > 0.5 && type < 1.5)) {
      float f = uFlowP[pi] * speed * 0.6 + phase;
      target += vec3(sin(f), cos(f * 1.3), sin(f * 0.7 + phase)) * (type < 0.5 ? 0.05 : 0.12);
    } else if (type < 2.5) {
      int ri = int(aInfo.z + 0.5);
      float a = uFlow * (0.05 + speed * 0.07) + phase;
      vec2 rr = uRibR[ri];
      vec3 jitter = vec3(sin(phase * 7.0), cos(phase * 5.0), sin(phase * 3.0)) * aInfo.w;
      target = uRibRot[ri] * vec3(cos(a) * rr.x, sin(a) * rr.y, 0.0) + jitter;
    } else {
      float f = uFlow * 0.08 * speed + phase;
      target += vec3(sin(f) * 1.6, cos(f * 1.2) * 1.1, sin(f * 0.8) * 1.6);
    }

    // Particles inside a crystal piece travel (and turn) with it.
    target = (uPieceM[pi] * vec4(target, 1.0)).xyz;

    // ---- Genesis -------------------------------------------------------
    vec3 from = aStart;
    if (early > 1.5) {
      // A handful of particles orbit the seed before everything else arrives.
      float a = uTime * (0.9 + speed) + phase;
      float r = 1.2 + seed * 1.6;
      from = vec3(cos(a) * r, sin(a * 0.7) * r * 0.45, sin(a) * r);
    } else if (early < 0.5) {
      float f = uTime * 0.05 + phase;
      from += vec3(sin(f), cos(f), 0.0) * 1.5;
    }

    float local = clamp((uGenesis - (0.24 + delay * 0.36)) / 0.22, 0.0, 1.0);
    float e = easeInOut(local);
    vec3 path = target - from;
    vec3 side = normalize(cross(path + vec3(1e-4), vec3(0.0, 1.0, 0.0)) + vec3(1e-4));
    float arc = sin(e * 3.14159);
    vec3 pos = mix(from, target, e) + side * arc * length(path) * 0.22 * (seed - 0.5) * 2.0
                                   + vec3(0.0, arc * length(path) * 0.06, 0.0);

    // ---- Scroll exit: open into an expanded field -----------------------
    float ex = clamp((type < 1.5 ? uExpandBody : uExpand) * 1.25 - delay * 0.25, 0.0, 1.0);
    ex = easeInOut(ex);
    vec3 drift = vec3(sin(uFlow * 0.1 + phase), cos(uFlow * 0.12 + phase), 0.0) * 1.2;
    pos = mix(pos, aExpand + drift, ex);

    // ---- Pointer: attract inside the letter, repel the open field ------
    vec3 dm = pos - uMouse;
    float dist = length(vec3(dm.xy, dm.z * 0.6));
    float fall = exp(-dist * dist / 10.0) * uMouseStr;
    float isField = step(1.5, type);
    float attract = mix(mix(0.55, -1.0, isField), -1.0, uMouseRepel);
    pos += (attract > 0.0 ? -dm * 0.35 : normalize(dm + vec3(1e-4)) * 1.4) * fall * abs(attract);

    // ---- Pulses: radial waves travelling through the field --------------
    float glint = 0.0;
    for (int i = 0; i < 4; i++) {
      vec4 pu = uPulses[i];
      float age = uTime - pu.w;
      if (age > 0.0 && age < 4.0) {
        vec3 d = pos - pu.xyz;
        float dl = length(d);
        float rd = (dl - age * 13.0) / 2.2;
        float ring = exp(-rd * rd);
        float amp = uPulseStr[i] * exp(-age * 1.3);
        pos += normalize(d + vec3(1e-4)) * ring * amp * 1.7;
        glint += ring * amp;
      }
    }

    // Particles catch light where the glass is being formed.
    float sd = (pos.y - uSweep) / 0.9;
    glint += exp(-sd * sd) * step(0.001, uSweep + 100.0) * 0.8 * (1.0 - step(0.999, uGenesis));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // ---- Visibility ----------------------------------------------------
    float appear;
    if (early > 0.5 && early < 1.5) appear = smoothstep(0.0, 0.03, uGenesis);
    else if (early > 1.5) appear = smoothstep(0.04 + seed * 0.05, 0.1 + seed * 0.05, uGenesis);
    else appear = smoothstep(0.12 + seed * 0.1, 0.24 + seed * 0.1, uGenesis);
    // The seed shrinks to a normal particle once the field arrives.
    float seedSize = early > 0.5 && early < 1.5 ? mix(1.0, 0.25, smoothstep(0.2, 0.4, uGenesis)) : 1.0;

    float twinkle = 0.75 + 0.25 * sin(uTime * (1.5 + speed * 2.0) + phase * 3.0);
    vAlpha = appear * mix(0.6, 0.95, uBoost) * (type > 2.5 ? 0.7 : 1.0);
    // Building particles dissolve into the glass once it has formed.
    if (type < 1.5) vAlpha *= uBuildVis;
    vGold = aRand.w * twinkle;
    vTone = fract(seed * 7.13);
    vGlint = clamp(glint, 0.0, 1.5);

    float size = aRand.x * seedSize * (1.0 + uBoost * 0.45 + vGlint * 0.8);
    gl_PointSize = min(size * uScale * uPixelRatio / -mv.z, 9.0 * uPixelRatio);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uSilver;
  uniform vec3 uGraphite;
  uniform vec3 uGold;
  uniform vec3 uBronze;
  varying float vAlpha;
  varying float vGold;
  varying float vGlint;
  varying float vTone;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    // Solid metallic fleck: hard core, short soft falloff. No rim, no bubble highlight.
    float core = 1.0 - smoothstep(0.0, 0.32, r);
    float halo = (1.0 - smoothstep(0.15, 0.5, r)) * 0.35;
    vec3 metal = mix(uBronze, uGold, vTone);
    vec3 col = mix(uSilver, metal, clamp(vGold + 0.55, 0.0, 1.0));
    // A few flecks catch the sun and spark (HDR → bloom).
    float spark = vGold * (0.6 + vGlint) ;
    col *= 1.0 + spark * 2.2 * core;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(col, a);
  }
`;

const Particles = forwardRef(function Particles({ model, count }, ref) {
  const geometry = useMemo(() => buildField(model, count), [model, count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uFlow: { value: 0 },
          uGenesis: { value: 0 },
          uExpand: { value: 0 },
          uBoost: { value: 0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 300 },
          uSweep: { value: -100 },
          uMouse: { value: new THREE.Vector3(999, 999, 0) },
          uMouseStr: { value: 0 },
          uMouseRepel: { value: 0 },
          uPulses: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, -100)) },
          uPulseStr: { value: [0, 0, 0, 0] },
          uPieceM: { value: Array.from({ length: 5 }, () => new THREE.Matrix4()) },
          uFlowP: { value: [0, 0, 0, 0, 0] },
          uExpandBody: { value: 0 },
          uBuildVis: { value: 1 },
          uRibRot: { value: ribbonMatrices() },
          uRibR: { value: RIBBONS.map((r) => new THREE.Vector2(r.rx, r.ry)) },
          uSilver: { value: new THREE.Color("#d9d4cb") },
          uGraphite: { value: new THREE.Color("#3a3b3e") },
          uGold: { value: new THREE.Color("#f2d29c") },
          uBronze: { value: new THREE.Color("#8c6735") },
        },
      }),
    []
  );

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
});

export default Particles;
