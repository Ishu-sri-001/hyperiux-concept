"use client";
"use no memo";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { store, INTERACTIVE } from "@/lib/store";
import { damp } from "@/lib/math";

const WHITE = "#f6f4f0";
const STONE = "#e6e3de";

/** Arch with a rectangular, softly bevelled profile: a ring sector extruded. */
function arch({ R, r, a0 = 0, a1 = Math.PI, depth = 2.4, bevel = 0.35 }) {
  const s = new THREE.Shape();
  s.absarc(0, 0, R, a0, a1, false);
  s.absarc(0, 0, r, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 96,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, -0.2, 1.0);
    vec3 horizon = vec3(0.86, 0.9, 0.95);
    vec3 zenith = vec3(0.5, 0.65, 0.85);
    vec3 col = mix(horizon, zenith, smoothstep(-0.02, 0.45, h));

    // Cumulus: billowy near the horizon, thinner overhead.
    vec2 uv = dir.xz / max(dir.y + 0.18, 0.06) * 0.75 + vec2(uTime * 0.006, 0.0);
    float base = fbm(uv * 1.2);
    float detail = fbm(uv * 4.0 + 3.1);
    float c = smoothstep(0.42, 0.78, base * 0.75 + detail * 0.35);
    c *= smoothstep(-0.02, 0.12, h) * (1.0 - smoothstep(0.55, 0.95, h) * 0.6);
    float shade = smoothstep(0.35, 0.9, detail);
    vec3 cloud = mix(vec3(0.86, 0.87, 0.9), vec3(1.05, 1.03, 1.0), shade);
    col = mix(col, cloud, c * 0.9);

    // Sun glow behind and above the sculpture (warm, slightly over 1 so it blooms).
    vec3 sunDir = normalize(vec3(0.15, 0.32, -1.0));
    float sd = max(dot(dir, sunDir), 0.0);
    col += vec3(1.0, 0.88, 0.7) * (pow(sd, 28.0) * 0.28 + pow(sd, 400.0) * 3.0);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );
  useFrame((s) => (material.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[220, 64, 32]} />
    </mesh>
  );
}

export default function Architecture({ config, layout }) {
  const group = useRef();
  const geos = useMemo(
    () => ({
      bridge: arch({ R: 15, r: 12.4, depth: 3.2 }),
      sweepL: arch({ R: 22, r: 19.2, a0: 0, a1: Math.PI * 0.62, depth: 3.6, bevel: 0.45 }),
      sweepR: arch({ R: 21, r: 18.4, a0: Math.PI * 0.38, a1: Math.PI, depth: 3.4, bevel: 0.45 }),
      far: arch({ R: 9, r: 7.4, depth: 2 }),
    }),
    []
  );

  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.82, metalness: 0 }), []);
  const inlay = useMemo(() => new THREE.MeshStandardMaterial({ color: "#cfcac2", roughness: 0.3, metalness: 0.2 }), []);
  const rod = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9dadc", roughness: 0.15, metalness: 0.9 }), []);

  // Very subtle parallax (only when interaction is enabled).
  const par = useRef({ x: 0, y: 0 });
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const k = store.reducedMotion || !INTERACTIVE ? 0 : 1;
    par.current.x = damp(par.current.x, store.pointer.x * 0.18 * k, 1.4, dt);
    par.current.y = damp(par.current.y, store.pointer.y * 0.08 * k, 1.4, dt);
    group.current.position.set(-par.current.x, -par.current.y * 0.5, 0);
  });

  const shadows = config.shadows;
  const x = layout.hX;

  return (
    <>
      <Sky />

      {/* Polished pale stone floor, nearly a mirror */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow={shadows}>
        <planeGeometry args={[320, 320]} />
        {config.reflector ? (
          <MeshReflectorMaterial
            resolution={config.reflector}
            blur={[60, 20]}
            mixBlur={0.25}
            mixStrength={2.4}
            mixContrast={1.05}
            mirror={1}
            depthScale={0}
            roughness={0.35}
            metalness={0.15}
            envMapIntensity={0.6}
            color="#66635f"
          />
        ) : (
          <meshStandardMaterial color={STONE} roughness={0.2} metalness={0.2} />
        )}
      </mesh>

      {/* Concentric inlays around the sculpture */}
      {[
        [5.2, 5.3],
        [7.4, 7.46],
        [10.6, 10.64],
      ].map(([a, b], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.006, 0]} material={inlay}>
          <ringGeometry args={[a, b, 200]} />
        </mesh>
      ))}

      <group ref={group}>
        {/* Arch spanning behind the H, opening onto the sky */}
        <mesh geometry={geos.bridge} material={white} position={[x + 1.5, 0, -17]} castShadow={shadows} receiveShadow={shadows} />
        {/* A smaller arch far beyond it, for depth */}
        <mesh geometry={geos.far} material={white} position={[x + 3, 0, -46]} rotation-y={0.25} />
        {/* Monumental sweeps on either side, curving overhead */}
        <mesh
          geometry={geos.sweepL}
          material={white}
          position={[x - 19, 0, -3]}
          rotation-y={Math.PI * 0.42}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <mesh
          geometry={geos.sweepR}
          material={white}
          position={[x + 20, 0, -6]}
          rotation-y={-Math.PI * 0.4}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        {/* Slim columns and suspended metal rods at the edges */}
        {[
          [-15, -10, 1.1],
          [-21, -4, 1.4],
          [17, -12, 1.2],
          [23, -3, 1.5],
        ].map(([cx, cz, cr], i) => (
          <mesh key={`c${i}`} material={white} position={[x + cx, 14, cz]} castShadow={shadows} receiveShadow={shadows}>
            <cylinderGeometry args={[cr, cr, 28, 40]} />
          </mesh>
        ))}
        {[
          [-9.5, -5],
          [-11, -2],
          [10.5, -6],
          [12.5, -2.5],
        ].map(([cx, cz], i) => (
          <mesh key={`r${i}`} material={rod} position={[x + cx, 15, cz]}>
            <cylinderGeometry args={[0.025, 0.025, 30, 8]} />
          </mesh>
        ))}
      </group>
    </>
  );
}
