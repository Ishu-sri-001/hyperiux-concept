"use client";
"use no memo";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import Particles from "./Particles";
import { useHModel, H_CENTER_Y, H_HEIGHT, PIECES } from "./useHModel";
import { store, now, addPulse, sendLight, INTERACTIVE, SHARD_HOVER } from "@/lib/store";
import { mulberry32 } from "@/lib/hGeometry";
import { damp, lerp, smoothstep, easeInOut, easeOut } from "@/lib/math";
import { getFacetMaps } from "./facetMap";
import { accentColor } from "@/lib/palette";
import { RIBBONS, RING_SPIN, ribbonBase, ribbonCurve } from "./ribbons";
import Gallery from "./Gallery";
import { frameTransform, frameWorldPoint, arrivalAt, FORM } from "./gallery";
import { PROJECTS } from "@/content/projects";

/** Clear optical crystal, shared by every shard. */
const CRYSTAL = {
  thickness: 4.5,
  roughness: 0,
  ior: 1.55,
  chromaticAberration: 0.04,
  anisotropicBlur: 0,
  distortion: 0.16,
  distortionScale: 0.25,
  temporalDistortion: 0.03,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
  attenuationDistance: 7,
  attenuationColor: "#efe0c6",
  color: "#ffffff",
  envMapIntensity: 4,
  specularIntensity: 1,
};

/** Solid crystal balls: strong refraction with a warm amber depth. */
const SPHERE_GLASS = {
  thickness: 2.2,
  roughness: 0,
  ior: 1.75,
  chromaticAberration: 0.08,
  anisotropicBlur: 0,
  distortion: 0,
  clearcoat: 1,
  attenuationDistance: 3.5,
  attenuationColor: "#e2c08c",
  color: "#fffaf2",
  envMapIntensity: 5,
};

/**
 * Hero exit choreography (P = hero scroll progress):
 *   cracks spread from the impact point → cracks heat to a gold glow + tremor
 *   → the crystal shatters into shards, nearest the impact first.
 */
const CRACK = [0.03, 0.36];
const HEAT = [0.26, 0.5];
const BURST = [0.46, 0.95];

/**
 * Services: which part of the H represents each service (01–04).
 * 01 top-left pillar, 02 right half, 03 left half, 04 bottom-right pillar.
 */
export const SERVICE_PIECES = [1, 3, 0, 2]; // pillarA, bodyR, bodyL, pillarB

// ---------------------------------------------------------------------------
// Crack seams: thin strips along every break line. They spread outward from the
// impact point, darken into visible fractures, then heat up to a gold glow.
// ---------------------------------------------------------------------------
const seamVertex = /* glsl */ `
  attribute float aAcross;
  varying float vAcross;
  varying vec3 vWorld;
  #include <clipping_planes_pars_vertex>
  void main() {
    vAcross = aAcross;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const seamFragment = /* glsl */ `
  uniform float uCrack;
  uniform vec3 uOrigin;
  uniform float uSpan;
  uniform float uHeat;
  uniform float uGlow;
  uniform float uHover;
  uniform vec3 uCursor;
  uniform float uCursorR;
  uniform float uCursorStr;
  uniform vec3 uCold;
  uniform vec3 uHot;
  varying float vAcross;
  varying vec3 vWorld;
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    float dist = length(vWorld - uOrigin) / uSpan;
    float reach = uCrack * 1.25;
    float grown = (1.0 - smoothstep(reach - 0.1, reach, dist)) * step(0.001, uCrack);
    // Fresh cracks near the front of the wave are brightest.
    // Squares written as x * x: pow() of a negative base is undefined (NaN on many GPUs → black bloom artefacts).
    float fd = (dist - reach) / 0.08;
    float front = exp(-fd * fd) * step(uCrack, 0.999);
    // Sharp line on the break itself, soft halo spreading into the crystal.
    float ca = vAcross * 5.0;
    float core = exp(-ca * ca);
    float halo = exp(-vAcross * 2.6);
    float cd = length(vWorld - uCursor) / uCursorR;
    float near = exp(-cd * cd) * uCursorStr * 0.55;
    float hot = max(max(uHeat, uHover), near);
    vec3 col = mix(uCold, uHot * (2.0 + uGlow * 3.2), hot);
    // White-hot centre when the crystal is about to burst.
    col += vec3(1.0, 0.92, 0.75) * core * uGlow * 1.8;
    col += uHot * front * 4.0;
    col += vec3(1.0, 0.9, 0.72) * core * near * 1.6;
    float a = grown * (core * 0.95 + halo * (0.12 + 0.5 * hot)) * clamp(0.8 + hot, 0.0, 1.0);
    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;

// ---------------------------------------------------------------------------
// Internal filaments
// ---------------------------------------------------------------------------
const lineVertex = /* glsl */ `
  varying vec2 vUv;
  #include <clipping_planes_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const lineFragment = /* glsl */ `
  uniform float uGrow;
  uniform float uHead;
  uniform float uLight;
  uniform float uTime;
  uniform float uBase;
  uniform float uAlpha;
  uniform vec3 uSilver;
  uniform vec3 uGold;
  varying vec2 vUv;
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    if (vUv.x > uGrow || uAlpha < 0.01) discard;
    float d = vUv.x - uHead;
    float head = exp(-d * d / 0.003) * uLight;
    float tail = smoothstep(-0.22, 0.0, d) * step(d, 0.0) * uLight * 0.4;
    float td = (vUv.x - uGrow) / 0.02;
    float tip = exp(-td * td) * step(uGrow, 0.999);
    float shimmer = 0.5 + 0.5 * sin(vUv.x * 46.0 - uTime * 1.3);
    float rr = abs(vUv.y - 0.5) * 2.0;
    float rim = rr * rr;
    vec3 col = mix(uSilver, uGold, 0.15 + 0.25 * shimmer);
    col *= uBase * (0.75 + rim * 0.9);
    col += uGold * (head * 6.0 + tail * 2.2 + tip * 4.0 + shimmer * 0.25);
    float a = clamp(0.32 + rim * 0.45 + shimmer * 0.1 + head + tail + tip, 0.0, 1.0) * uAlpha;
    gl_FragColor = vec4(col, a);
  }
`;

function GlowLine({ curve, radius, plane, register, offset = 0, base = 1.4 }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 160, radius, 6, false), [curve, radius]);
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: lineVertex,
      fragmentShader: lineFragment,
      transparent: true,
      depthWrite: false,
      clipping: true,
      clippingPlanes: [plane],
      uniforms: {
        uGrow: { value: 0 },
        uHead: { value: -1 },
        uLight: { value: 0 },
        uTime: { value: 0 },
        uBase: { value: base },
        uAlpha: { value: 1 },
        uSilver: { value: new THREE.Color("#f4f3f1") },
        uGold: { value: new THREE.Color("#f0d3a2") },
      },
    });
    m.userData = { offset };
    return m;
  }, [plane, offset, base]);
  register(material);
  return <mesh geometry={geometry} material={material} renderOrder={1} />;
}

/** Orbital wires: polished champagne chrome. Drawn in with the geometry draw range. */
function Wire({ curve, material, wires, index }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 320, 0.075, 10, true), [curve]);
  return <mesh geometry={geometry} material={material} ref={(m) => m && (wires.current[index] = m)} />;
}

const Z = new THREE.Vector3(0, 0, 1);

/** A strand twisting around a centre line: wide across the stroke, shallow in depth. */
function helix(curve, phase, side = 0.72, depth = 0.34, turns = 1.5) {
  const n = 140;
  const pts = [];
  const tan = new THREE.Vector3();
  const across = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = phase + t * turns * Math.PI * 2;
    const k = Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.88)) ** 0.35;
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tan);
    across.crossVectors(tan, Z).normalize();
    p.addScaledVector(across, Math.cos(a) * side * k).addScaledVector(Z, Math.sin(a) * depth * k);
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}

/** A smooth, smoky metal core of three twisting strands per stroke. */
function MetalCore({ curves, material }) {
  const geos = useMemo(
    () =>
      curves.flatMap((c, k) =>
        [0, 2.1, 4.2].map(
          (ph, j) => new THREE.TubeGeometry(helix(c, ph + k * 0.7, 0.62 - j * 0.1, 0.3, 1.1 + j * 0.3), 220, 0.22 - j * 0.05, 16, false)
        )
      ),
    [curves]
  );
  return geos.map((g, i) => <mesh key={i} geometry={g} material={material} />);
}

// Floating crystal balls (world units, relative to the H's floor position).
const SPHERES = [
  { p: [-0.9, 6.4, -1.4], r: 0.3 },
  { p: [3.9, 6.9, -2.6], r: 0.42 },
  { p: [1.3, 7.4, 0.8], r: 0.18 },
  { p: [5.1, 2.3, 1.2], r: 0.32 },
  { p: [-1.2, 0.9, 2.6], r: 0.16 },
  { p: [7.2, 5.4, -4.6], r: 0.5 },
  { p: [2.6, 0.5, 3.2], r: 0.13 },
  { p: [-2.2, 4.4, -5.5], r: 0.24 },
  { p: [6.4, 0.7, -1.4], r: 0.2 },
];

function Spheres({ count, buffer, samples, glassRefs, groupRef }) {
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 48, 32), []);
  return (
    <group ref={groupRef}>
      {SPHERES.slice(0, count).map((s, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={s.p}
          scale={s.r}
          userData={{ base: new THREE.Vector3(...s.p), r: s.r }}
          ref={(m) => m && glassRefs.current.add(m)}
        >
          <MeshTransmissionMaterial {...SPHERE_GLASS} samples={Math.min(samples, 4)} buffer={buffer} />
        </mesh>
      ))}
    </group>
  );
}

const EDGE_BASE = new THREE.Color("#8f7a5c");

export default function HSculpture({ config, layout }) {
  const model = useHModel(config.shards);
  const { gl, scene, camera, raycaster, size } = useThree();
  const maps = useMemo(() => getFacetMaps(), []);
  const ribbons = useMemo(() => RIBBONS.map(ribbonCurve), []);
  const [crystal, setCrystal] = useState(null);

  const fbo = useFBO(config.buffer, config.buffer, { type: THREE.HalfFloatType });
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000), []);

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5c4934",
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.8,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        clippingPlanes: [plane],
      }),
    [plane]
  );
  const wireMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#efe3cf",
        metalness: 1,
        roughness: 0.05,
        envMapIntensity: 3.4,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
      }),
    []
  );
  // Per piece, so a hovered service can light up its own outline and cracks.
  const edgeMaterials = useMemo(
    () =>
      PIECES.map(
        () =>
          new THREE.LineBasicMaterial({
            color: EDGE_BASE.clone(),
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            clippingPlanes: [plane],
          })
      ),
    [plane]
  );
  const seamUniforms = useMemo(
    () => ({
      uCrack: { value: 0 },
      uOrigin: { value: new THREE.Vector3() },
      uSpan: { value: H_HEIGHT * 0.95 },
      uHeat: { value: 0 },
      uGlow: { value: 0 },
      uCold: { value: new THREE.Color("#4f4a43") },
      uHot: { value: new THREE.Color("#f2a24c") },
      uCursor: { value: new THREE.Vector3(999, 999, 999) },
      uCursorR: { value: 1.0 },
      uCursorStr: { value: 0 },
    }),
    []
  );
  const seamMaterials = useMemo(
    () =>
      PIECES.map(
        () =>
          new THREE.ShaderMaterial({
            vertexShader: seamVertex,
            fragmentShader: seamFragment,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            clipping: true,
            clippingPlanes: [plane],
            uniforms: { ...seamUniforms, uHover: { value: 0 } },
          })
      ),
    [plane, seamUniforms]
  );

  // Per-shard motion, fixed at load (deterministic).
  const shards = useMemo(() => {
    const rng = mulberry32(4242);
    const list = [];
    let maxDist = 0;
    PIECES.forEach((name, pi) => {
      const piece = model.pieces[name];
      piece.shards.forEach((sh) => {
        const rest = piece.offset.clone().add(sh.center);
        const dist = Math.hypot(rest.x - model.impact.x, rest.y - model.impact.y);
        maxDist = Math.max(maxDist, dist);
        list.push({ ...sh, pi, rest, dist });
      });
    });
    list.forEach((s) => {
      const away = new THREE.Vector3(s.rest.x - model.impact.x, s.rest.y - model.impact.y, 0).normalize();
      s.dir = away
        .multiplyScalar(1)
        .add(new THREE.Vector3((rng() - 0.5) * 0.9, (rng() - 0.3) * 0.9, 1.1 + rng() * 1.4))
        .normalize();
      s.travel = (8 + rng() * 11) * (1.15 - 0.45 * (s.dist / maxDist));
      s.axis = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
      s.spin = (1.5 + rng() * 4.5) * (rng() < 0.5 ? -1 : 1);
      s.delay = (s.dist / maxDist) * 0.42;
      s.gather = rng() * 0.35;
      s.phase = rng() * Math.PI * 2;
      // Exploded-view placement: spread apart, still reading as an H.
      s.svc = new THREE.Vector3(
        s.rest.x * 1.34 + (rng() - 0.5) * 1.4,
        s.rest.y * 1.16 + (rng() - 0.5) * 1.2,
        s.rest.z + (rng() - 0.5) * 6
      );
      s.svcQ = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - 0.5) * 0.9, (rng() - 0.5) * 1.1, (rng() - 0.5) * 0.7));
      // Ice hover: spring-damped push away from the cursor.
      s.off = new THREE.Vector3();
      s.vel = new THREE.Vector3();
      s.give = 0.75 + rng() * 0.5;
    });
    // Work: shards build the gallery frames. Left side of the exploded H feeds the
    // left frames, and so on. Within a frame, shards land clockwise from the
    // top-left corner, each arriving exactly when the growing border reaches it.
    const frames = PROJECTS.map((_, i) => frameTransform(i, PROJECTS.length));
    const byX = [...list].sort((a, b) => a.svc.x - b.svc.x);
    const per = Math.ceil(byX.length / frames.length);
    frames.forEach((f, fi) => {
      const group = byX.slice(fi * per, (fi + 1) * per);
      if (!group.length) return;
      const c = group.reduce((acc, s) => acc.add(s.svc), new THREE.Vector3()).divideScalar(group.length);
      // Clockwise order starting top-left, so pieces fly roughly to their nearest stretch of border.
      const order = (s) => {
        const a = Math.atan2(s.svc.y - c.y, s.svc.x - c.x);
        return (((Math.PI * 0.75 - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      };
      group.sort((a, b) => order(a) - order(b));
      group.forEach((s, k) => {
        const u = (k + 0.5) / group.length;
        s.frameIndex = fi;
        s.frameTarget = frameWorldPoint(f, u);
        s.arrive = arrivalAt(fi, u);
        s.frameQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.rotationY);
      });
    });
    return list;
  }, [model]);

  // Centre of each piece's shards in the exploded view (where its service points).
  const pieceSvcCenter = useMemo(
    () =>
      PIECES.map((_, pi) => {
        const mine = shards.filter((s) => s.pi === pi);
        const c = new THREE.Vector3();
        mine.forEach((s) => c.add(s.svc));
        return mine.length ? c.divideScalar(mine.length) : c;
      }),
    [shards]
  );

  const outer = useRef();
  const tilt = useRef();
  const wireGroup = useRef();
  const cursorLight = useRef();
  const pieceRefs = useRef([]);
  const shardRefs = useRef([]);
  const spheres = useRef();
  const particles = useRef();
  const glassRefs = useRef(new Set());
  const lineMats = useRef(new Set());
  const wires = useRef([]);
  const ringBase = useMemo(() => ribbonBase(), []);
  const ringTmp = useMemo(() => ({ q: new THREE.Quaternion(), m: new THREE.Matrix4() }), []);
  const register = (m) => lineMats.current.add(m);

  const rest = useMemo(
    () =>
      PIECES.map((name) => {
        const m = new THREE.Matrix4().makeTranslation(model.pieces[name].offset);
        return { matrix: m, inverse: m.clone().invert() };
      }),
    [model]
  );

  const tmp = useMemo(
    () => ({
      plane: new THREE.Plane(),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
      mouse: new THREE.Vector3(999, 999, 0),
      center: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      ndc: new THREE.Vector2(),
      v: new THREE.Vector3(),
      w: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      qb: new THREE.Quaternion(),
      e: new THREE.Euler(),
      lean: [0, 0, 0, 0],
      cA: new THREE.Color(),
      cB: new THREE.Color(),
      cursor: new THREE.Vector3(),
      cursorPrev: new THREE.Vector3(),
      cursorWorld: new THREE.Vector3(),
      trail: [],
      hoverStr: 0,
      push: new THREE.Vector3(),
      d: new THREE.Vector3(),
      tiltAxis: new THREE.Vector3(),
      qh: new THREE.Quaternion(),
      rot: { x: 0, y: 0 },
      hover: [0, 0, 0, 0],
      focus: [0, 0, 0, 0],
      flowP: [0, 0, 0, 0, 0],
      mouseStr: 0,
      repel: 0,
      lastWave: 0,
      flow: 0,
      nextLight: now() + 9,
      genesisLight: false,
    }),
    []
  );

  const onPointerDown = (e) => {
    if (!INTERACTIVE || !tilt.current) return;
    e.stopPropagation();
    addPulse(tilt.current.worldToLocal(e.point.clone()), 1);
    sendLight();
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = now();
    const rm = store.reducedMotion ? 0.12 : 1;
    const g = store.genesis;
    const P = store.heroSmooth ?? 0;
    const Sraw = store.servicesSmooth ?? 0;
    const W = store.workInSmooth ?? 0;
    const S = easeInOut(Sraw);

    // ---- Hero exit phases ----------------------------------------------
    const crackT = smoothstep(CRACK[0], CRACK[1], P);
    const heat = smoothstep(HEAT[0], HEAT[1], P);
    const burstRaw = smoothstep(BURST[0], BURST[1], P);
    const tremor = heat * (1 - smoothstep(BURST[0], BURST[0] + 0.1, P)) * rm;

    // ---- Whole-H transform ---------------------------------------------
    const px = INTERACTIVE ? store.pointer.x : 0;
    const py = INTERACTIVE ? store.pointer.y : 0;
    tmp.rot.y = damp(tmp.rot.y, px * 0.22 * rm, 2.2, dt);
    tmp.rot.x = damp(tmp.rot.x, -py * 0.09 * rm, 2.2, dt);

    const breathe = 1 + Math.sin(t * 0.55) * 0.006 * rm;
    const s = model.scale * breathe;
    outer.current.scale.setScalar(s);
    outer.current.position.set(layout.hX, H_CENTER_Y + Math.sin(t * 0.4) * 0.05 * rm * (1 - S), 0);
    const heroRotY = layout.hRotY + Math.sin(t * 0.11) * 0.09 * rm + tmp.rot.y + easeInOut(P) * 0.55;
    tilt.current.rotation.set(
      lerp(tmp.rot.x + P * 0.06, 0, S),
      lerp(heroRotY, 0, S),
      lerp(Math.sin(t * 0.17) * 0.012 * rm, 0, S)
    );
    outer.current.updateMatrixWorld(true);

    // ---- Services: the H stays shattered, as an exploded view ------------
    if (!store.focusPoint) store.focusPoint = new THREE.Vector3(layout.hX, H_CENTER_Y, 0);
    const hoverIdx = store.serviceHover;
    const focusIdx = store.serviceFocus;
    // The metal core dissolves when the crystal bursts.
    const innerVis = 1 - smoothstep(BURST[0], BURST[0] + 0.14, P);

    PIECES.forEach((name, pi) => {
      const svcIndex = SERVICE_PIECES.indexOf(pi);
      tmp.hover[svcIndex] = damp(tmp.hover[svcIndex], hoverIdx === svcIndex ? 1 : 0, 6, dt);
      tmp.focus[svcIndex] = damp(tmp.focus[svcIndex], focusIdx === svcIndex ? 1 : 0, 4, dt);
      const k = Math.max(tmp.hover[svcIndex], tmp.focus[svcIndex]);
      tmp.lean[pi] = (tmp.hover[svcIndex] * 3 + tmp.focus[svcIndex] * 2) * S;

      const grp = pieceRefs.current[pi];
      grp.visible = innerVis > 0.01;

      accentColor("edge", store.accentMix, tmp.cA);
      accentColor("edgeHot", store.accentMix, tmp.cB);
      edgeMaterials[pi].color.lerpColors(tmp.cA, tmp.cB, k);
      edgeMaterials[pi].opacity = (0.5 + k * 0.45) * (1 - burstRaw * 0.5);
      seamMaterials[pi].uniforms.uHover.value = k * S;
      tmp.flowP[pi] += dt * (store.reducedMotion ? 0.25 : 1);

      // Where this service's cluster of shards sits on screen (for the connector line).
      tmp.w.copy(pieceSvcCenter[pi]);
      tmp.w.z += tmp.lean[pi];
      tilt.current.localToWorld(tmp.w);
      if (focusIdx === svcIndex) store.focusPoint.copy(tmp.w);
      tmp.v.copy(tmp.w).project(camera);
      const f = store.formations[svcIndex];
      f.x = (tmp.v.x * 0.5 + 0.5) * size.width;
      f.y = (-tmp.v.y * 0.5 + 0.5) * size.height;
    });
    tmp.flowP[4] += dt * (store.reducedMotion ? 0.25 : 1);
    // Orange mode: brighter, more reflective metal so the core reads as polished orange.
    coreMaterial.opacity = lerp(0.86, 0.95, store.accentMix) * innerVis;
    coreMaterial.envMapIntensity = lerp(1.8, 3, store.accentMix);
    coreMaterial.roughness = lerp(0.2, 0.14, store.accentMix);

    // ---- Ice hover on the exploded H: cursor in H space + a short wake ----
    const hoverZone = SHARD_HOVER ? smoothstep(0.6, 1, Sraw) * (1 - smoothstep(0, 0.25, W)) : 0;
    const pointerOn = store.pointer.active && t - store.pointer.lastMove < 4;
    tmp.hoverStr = damp(tmp.hoverStr, hoverZone * (pointerOn ? 1 : 0), 4, dt);
    if (tmp.hoverStr > 0.001) {
      tmp.center.set(layout.hX, H_CENTER_Y, 0);
      camera.getWorldDirection(tmp.normal).negate();
      tmp.plane.setFromNormalAndCoplanarPoint(tmp.normal, tmp.center);
      tmp.ndc.set(store.pointer.x, store.pointer.y);
      raycaster.setFromCamera(tmp.ndc, camera);
      if (raycaster.ray.intersectPlane(tmp.plane, tmp.hit)) {
        tmp.cursorWorld.copy(tmp.hit);
        tilt.current.worldToLocal(tmp.cursor.copy(tmp.hit));
        // Drop wake points as the cursor travels; they fade over ~0.7 s.
        if (tmp.cursor.distanceTo(tmp.cursorPrev) > 0.6) {
          tmp.trail.push({ p: tmp.cursor.clone(), life: Math.min(1, store.pointer.speed * 0.35 + 0.35) });
          if (tmp.trail.length > 10) tmp.trail.shift();
          tmp.cursorPrev.copy(tmp.cursor);
        }
      }
    }
    tmp.trail.forEach((p) => (p.life -= dt * 1.4));
    tmp.trail = tmp.trail.filter((p) => p.life > 0);
    seamUniforms.uCursor.value.copy(tmp.cursorWorld);
    seamUniforms.uCursorStr.value = tmp.hoverStr;
    if (cursorLight.current) {
      cursorLight.current.position.copy(tmp.cursorWorld).addScaledVector(tmp.normal, 0.8);
      cursorLight.current.intensity = tmp.hoverStr * 5;
      accentColor("light", store.accentMix, cursorLight.current.color);
    }

    // ---- Shards: crack open → shatter outward → settle as an exploded H ---
    shards.forEach((sh, i) => {
      const obj = shardRefs.current[i];
      if (!obj) return;
      const b = easeOut(THREE.MathUtils.clamp((burstRaw - sh.delay) / (1 - sh.delay), 0, 1));
      const gS = easeInOut(THREE.MathUtils.clamp((Sraw - sh.gather) / 0.65, 0, 1));
      // Cracks opening: shards part slightly before they fly.
      const gap = heat * 0.06 * (1 - b);
      const jit = tremor * 0.045;
      tmp.v.copy(sh.rest).addScaledVector(sh.dir, sh.travel * b + gap);
      tmp.v.x += Math.sin(t * 33 + sh.phase) * jit;
      tmp.v.y += Math.cos(t * 29 + sh.phase) * jit;
      tmp.v.y += b * b * -1.2 + Math.sin(t * 0.5 + sh.phase) * 0.25 * b * rm;
      tmp.qb.setFromAxisAngle(sh.axis, sh.spin * b + Math.sin(t * 0.4 + sh.phase) * 0.15 * b * rm);

      // Exploded view: each shard floats a little apart from its place in the H.
      const fc = tmp.focus[SERVICE_PIECES.indexOf(sh.pi)];
      tmp.w.copy(sh.svc);
      tmp.w.x += Math.sin(t * 0.21 + sh.phase) * 0.22 * rm;
      tmp.w.y += Math.cos(t * 0.17 + sh.phase) * 0.28 * rm;
      tmp.w.z += tmp.lean[sh.pi];
      tmp.q.setFromAxisAngle(sh.axis, Math.sin(t * 0.15 + sh.phase) * 0.18 * rm + fc * t * 0.3);
      tmp.q.premultiply(sh.svcQ);

      // Ice hover: shards near the cursor (and its wake) are shoved aside and toward
      // the viewer, tilt away, then spring back with a little overshoot.
      tmp.push.set(0, 0, 0);
      if (tmp.hoverStr > 0.001) {
        const R2 = 3.4 * 3.4;
        const add = (p, strength) => {
          tmp.d.subVectors(tmp.w, p);
          tmp.d.z *= 0.35;
          const d2 = tmp.d.lengthSq();
          const f = Math.exp(-d2 / R2) * strength;
          if (f < 0.002) return;
          const len = Math.sqrt(d2) + 1e-3;
          tmp.push.x += (tmp.d.x / len) * f * 1.6;
          tmp.push.y += (tmp.d.y / len) * f * 1.6;
          tmp.push.z += f * 1.2;
        };
        add(tmp.cursor, tmp.hoverStr);
        tmp.trail.forEach((p) => add(p.p, p.life * 0.35 * tmp.hoverStr));
        tmp.push.multiplyScalar(sh.give);
      }
      // Spring (stiff, lightly damped) toward the push target.
      sh.vel.addScaledVector(tmp.d.subVectors(tmp.push, sh.off), 60 * dt);
      sh.vel.multiplyScalar(Math.exp(-8 * dt));
      sh.off.addScaledVector(sh.vel, dt);
      tmp.w.add(sh.off);
      const offLen = sh.off.length();
      if (offLen > 1e-4) {
        tmp.tiltAxis.set(-sh.off.y, sh.off.x, 0).normalize();
        tmp.qh.setFromAxisAngle(tmp.tiltAxis, Math.min(offLen * 0.14, 0.4));
        tmp.q.premultiply(tmp.qh);
      }

      obj.position.lerpVectors(tmp.v, tmp.w, gS);
      obj.quaternion.copy(tmp.qb).slerp(tmp.q, gS);

      // Work: the shard leaves the H, arcs over to its frame and lands just as the
      // border grows through that spot, then fuses into the glass bar.
      let sc = 1;
      if (W > 0 && sh.frameTarget) {
        const k = THREE.MathUtils.clamp((W - (sh.arrive - FORM.flight)) / FORM.flight, 0, 1);
        if (k > 0) {
          const e = easeInOut(k);
          tilt.current.worldToLocal(tmp.v.copy(sh.frameTarget));
          obj.position.lerp(tmp.v, e);
          // A soft arc up and toward the viewer, so the pieces visibly travel.
          const lift = Math.sin(Math.PI * e);
          obj.position.y += lift * 3.2;
          obj.position.z += lift * 2.4;
          obj.quaternion.slerp(sh.frameQ, e);
          sc = 1 - e * 0.45;
        }
        // Fuse into the border right after landing.
        sc *= 1 - THREE.MathUtils.clamp((W - sh.arrive) / 0.045, 0, 1);
      }
      obj.scale.setScalar(Math.max(sc, 0.0001));
      obj.visible = sc > 0.002;
    });

    // ---- Genesis: glass sweeps in, filaments + wires grow ----------------
    const reveal = easeInOut(smoothstep(0.6, 0.86, g));
    const bottom = H_CENTER_Y - H_HEIGHT / 2 - 0.3;
    const sweepY = reveal >= 1 ? 1000 : bottom + reveal * (H_HEIGHT + 0.6);
    plane.constant = sweepY;
    const grow = easeInOut(smoothstep(0.5, 0.8, g));
    const ribbonGrow = easeInOut(smoothstep(0.72, 0.98, g)) * (1 - S);

    if (!tmp.genesisLight && g > 0.84) {
      tmp.genesisLight = true;
      sendLight();
    }
    if (t > tmp.nextLight && g >= 1 && !store.reducedMotion) {
      sendLight();
      tmp.nextLight = t + 7 + Math.random() * 5;
    }

    const age = t - store.lightAt;
    const light = age >= 0 && age < 3.2 ? Math.sin(Math.min(1, age / 3.2) * Math.PI) : 0;
    lineMats.current.forEach((m) => {
      m.uniforms.uGrow.value = grow;
      m.uniforms.uHead.value = age * 0.42 - m.userData.offset;
      m.uniforms.uLight.value = light + heat * 0.6;
      m.uniforms.uTime.value = t;
      m.uniforms.uAlpha.value = innerVis;
    });

    // ---- Crack seams --------------------------------------------------
    tilt.current.localToWorld(seamUniforms.uOrigin.value.copy(model.impact));
    seamUniforms.uCrack.value = crackT;
    const flicker = 1 + Math.sin(t * 19) * 0.15 * tremor + Math.sin(t * 7.3) * 0.08 * heat;
    // Heat peaks just before the burst, then cools to embers; seams settle to faint gold in services.
    seamUniforms.uHeat.value = Math.max(heat * (1 - burstRaw * 0.7), S * 0.4);
    seamUniforms.uGlow.value = (heat * 5 * (1 - burstRaw * 0.75)) * flicker;
    // The crystal itself warms from inside as the cracks heat up.
    if (crystal) {
      accentColor("seamHot", store.accentMix, crystal.emissive);
      accentColor("crystalTint", store.accentMix, crystal.attenuationColor);
      crystal.emissiveIntensity = heat * 0.32 * (1 - burstRaw * 0.85) * flicker + seamUniforms.uHeat.value * 0.04;
    }

    // Wires unwind as the services formation takes over.
    // Rings turn with the scroll, each about its own axis; the circles riding them follow.
    const spin = easeInOut(P);
    const ribRot = particles.current.material.uniforms.uRibRot.value;
    RING_SPIN.forEach((r, i) => {
      ringTmp.q.setFromAxisAngle(r.axis, spin * r.speed);
      const w = wires.current[i];
      if (w) w.quaternion.copy(ringTmp.q);
      ringTmp.m.makeRotationFromQuaternion(ringTmp.q).multiply(ringBase[i]);
      ribRot[i].setFromMatrix4(ringTmp.m);
    });

    wires.current.forEach((w) => {
      const total = w.geometry.index.count;
      w.geometry.setDrawRange(0, Math.floor((total * ribbonGrow) / 6) * 6);
      w.visible = ribbonGrow > 0.001;
    });
    wireGroup.current.scale.setScalar(1 + easeOut(burstRaw) * 0.35);

    // Spheres: slow float, appear with the glass, drift outward on scroll.
    spheres.current.children.forEach((m, i) => {
      const { base, r } = m.userData;
      const k = easeInOut(smoothstep(0.72 + i * 0.02, 0.97, g));
      const out = easeInOut(smoothstep(0.4, 1, P));
      m.position.set(
        base.x * (1 + out * 0.6) + Math.sin(t * 0.16 + i) * 0.08 * rm,
        base.y + Math.sin(t * 0.23 + i * 1.7) * 0.14 * rm + out * (base.y - 3) * 0.4,
        base.z + Math.cos(t * 0.13 + i) * 0.06 * rm + out * 3.5
      );
      m.scale.setScalar(Math.max(r * k * (1 - smoothstep(0.2, 0.7, W)), 0.0001));
    });

    // ---- Pointer (disabled while INTERACTIVE is false) ------------------
    const pointerLive = INTERACTIVE && store.pointer.active && t - store.pointer.lastMove < 2.5;
    if (pointerLive) {
      tmp.center.set(layout.hX, H_CENTER_Y, 0);
      camera.getWorldDirection(tmp.normal).negate();
      tmp.plane.setFromNormalAndCoplanarPoint(tmp.normal, tmp.center);
      tmp.ndc.set(px, py);
      raycaster.setFromCamera(tmp.ndc, camera);
      if (raycaster.ray.intersectPlane(tmp.plane, tmp.hit)) {
        tilt.current.worldToLocal(tmp.local.copy(tmp.hit));
        if (tmp.mouseStr < 0.01) tmp.mouse.copy(tmp.local);
        tmp.mouse.lerp(tmp.local, 1 - Math.exp(-6 * dt));
      }
    }
    tmp.mouseStr = damp(tmp.mouseStr, pointerLive && g > 0.2 ? 1 : 0, 3, dt);
    store.pointer.speed *= Math.exp(-dt * 5);
    tmp.repel = damp(tmp.repel, pointerLive ? smoothstep(1.6, 4.5, store.pointer.speed) : 0, 4, dt);
    if (pointerLive && store.pointer.speed > 3.2 && t - tmp.lastWave > 0.4) {
      tmp.lastWave = t;
      addPulse(tmp.mouse, 0.32);
    }

    // ---- Particle uniforms --------------------------------------------
    const flowSpeed = (INTERACTIVE && store.navHover >= 0 ? 1.7 : 1) * (store.reducedMotion ? 0.25 : 1);
    tmp.flow += dt * flowSpeed;
    // ---- Accent colour (gold ↔ Hyperiux orange) ------------------------
    const am = store.accentMix;
    accentColor("seamHot", am, seamUniforms.uHot.value);
    accentColor("core", am, coreMaterial.color);
    accentColor("wire", am, wireMaterial.color);
    lineMats.current.forEach((m) => accentColor("filament", am, m.uniforms.uGold.value));
    spheres.current.children.forEach((m) => m.material?.attenuationColor && accentColor("sphereTint", am, m.material.attenuationColor));

    const u = particles.current.material.uniforms;
    accentColor("particle", am, u.uGold.value);
    accentColor("particleDeep", am, u.uBronze.value);
    u.uTime.value = t;
    u.uFlow.value = tmp.flow;
    tmp.flowP.forEach((v, i) => (u.uFlowP.value[i] = v));
    u.uGenesis.value = g;
    u.uBuildVis.value = 1 - smoothstep(0.8, 0.98, g);
    u.uExpand.value = smoothstep(0.45, 1, P);
    // Particles inside the crystal burst out with the shards, then return to their piece.
    u.uExpandBody.value = easeOut(burstRaw) * (1 - S);
    u.uBoost.value = Math.max(smoothstep(0, 0.55, P) * (1 - S), heat * 0.6);
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uScale.value = state.size.height * 0.42;
    u.uSweep.value = reveal > 0 && reveal < 1 ? (sweepY - H_CENTER_Y) / s : -100;
    u.uMouse.value.copy(tmp.mouse);
    u.uMouseStr.value = tmp.mouseStr;
    u.uMouseRepel.value = tmp.repel;
    store.pulses.forEach((p, i) => {
      u.uPulses.value[i].set(p.point.x, p.point.y, p.point.z, p.time);
      u.uPulseStr.value[i] = p.strength;
    });

    // ---- One shared refraction buffer for every glass surface ----------
    const glass = glassRefs.current;
    glass.forEach((o) => (o.visible = false));
    const tone = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    gl.setRenderTarget(fbo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.toneMapping = tone;
    glass.forEach((o) => (o.visible = true));
  });

  const inner = (name) => {
    const fil = model.filaments.map((f, i) => ({ ...f, i })).filter((f) => f.piece === name);
    return (
      <>
        <MetalCore curves={fil.filter((f) => f.core).map((f) => f.curve)} material={coreMaterial} />
        {fil.map((f) => (
          <GlowLine key={f.i} curve={f.curve} radius={0.13} plane={plane} register={register} offset={f.i * 0.07} />
        ))}
      </>
    );
  };

  return (
    <>
      {/* Carries the one crystal material every shard shares (never drawn itself). */}
      <mesh visible={false}>
        <boxGeometry args={[0.001, 0.001, 0.001]} />
        <MeshTransmissionMaterial
          ref={(m) => m && m !== crystal && setCrystal(m)}
          {...CRYSTAL}
          samples={config.samples}
          buffer={fbo.texture}
          clippingPlanes={[plane]}
          normalMap={maps.normal}
          normalScale={[0.75, 0.75]}
        />
      </mesh>

      <group ref={outer}>
        <group ref={tilt}>
          {PIECES.map((name, pi) => (
            <group key={name} ref={(r) => (pieceRefs.current[pi] = r)} position={model.pieces[name].offset}>
              {inner(name)}
            </group>
          ))}

          {crystal &&
            shards.map((sh, i) => (
              <group key={i} ref={(r) => (shardRefs.current[i] = r)} position={sh.rest}>
                <mesh
                  geometry={sh.geometry}
                  material={crystal}
                  ref={(m) => m && glassRefs.current.add(m)}
                  onPointerDown={INTERACTIVE ? onPointerDown : undefined}
                />
                <mesh geometry={sh.seams} material={seamMaterials[sh.pi]} renderOrder={3} ref={(m) => m && glassRefs.current.add(m)} />
                <lineSegments geometry={sh.edges} material={edgeMaterials[sh.pi]} ref={(m) => m && glassRefs.current.add(m)} />
              </group>
            ))}

          <group ref={wireGroup}>
            {ribbons.map((c, i) => (
              <Wire key={`r${i}`} index={i} curve={c} material={wireMaterial} wires={wires} />
            ))}
          </group>
          <Particles ref={particles} model={model} count={config.particles} />
        </group>
      </group>
      {crystal && <Gallery crystal={crystal} glassRefs={glassRefs} />}
      <pointLight ref={cursorLight} color="#ffd9a8" intensity={0} distance={5} decay={2} />
      <group position={[layout.hX, 0, 0]}>
        <Spheres count={config.fragments + 2} buffer={fbo.texture} samples={config.samples} glassRefs={glassRefs} groupRef={spheres} />
      </group>
    </>
  );
}
