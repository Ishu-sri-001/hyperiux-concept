"use client";
"use no memo";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { store, emit } from "@/lib/store";
import { damp, smoothstep } from "@/lib/math";
import { PROJECTS } from "@/content/projects";
import { frameTransform, frameBars, frameLocalPoint, frameGrow, contentVisible, BAR, BAR_DEPTH } from "./gallery";
import { accentColor } from "@/lib/palette";

const contentVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const contentFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec2 uCover;
  uniform float uOpacity;
  uniform float uHover;
  uniform float uIndex;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec3 col;
    if (uHasMap > 0.5) {
      vec2 uv = (vUv - 0.5) * uCover + 0.5;
      col = texture2D(uMap, uv).rgb;
    } else {
      // Empty slot: quiet porcelain with a slow sweep of light. Deliberately contentless.
      vec2 p = vUv - 0.5;
      col = mix(vec3(0.94, 0.925, 0.9), vec3(0.82, 0.8, 0.77), clamp(vUv.y * 0.55 + length(p) * 0.6, 0.0, 1.0));
      float band = fract(vUv.x * 0.7 + vUv.y * 0.35 - uTime * 0.035 + uIndex * 0.19);
      col += (1.0 - smoothstep(0.0, 0.2, abs(band - 0.5))) * 0.045;
      float frameLine = step(0.48, max(abs(p.x), abs(p.y)));
      col = mix(col, col * 0.93, frameLine);
    }
    col *= 0.94 + uHover * 0.1;
    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** One glass bar of the border, spanning x ∈ [0, len] so it can grow from its start. */
function barGeometry(len) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -BAR / 2);
  shape.lineTo(len, -BAR / 2);
  shape.lineTo(len, BAR / 2);
  shape.lineTo(0, BAR / 2);
  shape.closePath();
  const bevel = 0.025;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: BAR_DEPTH - bevel * 2,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
  });
  g.translate(0, 0, -(BAR_DEPTH - bevel * 2) / 2);
  return g;
}

/** Soft round glow used for the spark that rides the growing border. */
let sparkTexture = null;
function getSparkTexture() {
  if (sparkTexture) return sparkTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  sparkTexture = new THREE.CanvasTexture(c);
  return sparkTexture;
}

function useProjectTexture(media, active) {
  const ref = useRef({ texture: null, aspect: 1.6 });
  useEffect(() => {
    if (!media || !active || ref.current.texture) return;
    let disposed = false;
    if (/\.(mp4|webm|mov)$/i.test(media)) {
      const video = document.createElement("video");
      Object.assign(video, { src: media, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
      video.addEventListener("loadeddata", () => {
        if (disposed) return;
        const t = new THREE.VideoTexture(video);
        t.colorSpace = THREE.SRGBColorSpace;
        ref.current = { texture: t, aspect: video.videoWidth / video.videoHeight, video };
        video.play().catch(() => {});
      });
      video.load();
    } else {
      new THREE.TextureLoader().load(media, (t) => {
        if (disposed) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        ref.current = { texture: t, aspect: t.image.width / t.image.height };
      });
    }
    return () => {
      disposed = true;
    };
  }, [media, active]);
  return ref;
}

function Frame({ index, count, crystal, glassRefs }) {
  const project = PROJECTS[index];
  const f = useMemo(() => frameTransform(index, count), [index, count]);
  // Border = four bars drawn clockwise; each grows as the shards land on it.
  const bars = useMemo(() => {
    const { bars: list, total } = frameBars(f);
    return list.map((bar) => {
      const geometry = barGeometry(bar.len);
      return { ...bar, total, geometry, edges: new THREE.EdgesGeometry(geometry, 25) };
    });
  }, [f]);
  const barRefs = useRef([]);
  const spark = useRef();
  const sparkMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: getSparkTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    []
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#9a8466", transparent: true, opacity: 0.55, depthWrite: false }),
    []
  );
  const content = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: contentVertex,
        fragmentShader: contentFragment,
        transparent: true,
        uniforms: {
          uMap: { value: null },
          uHasMap: { value: 0 },
          uCover: { value: new THREE.Vector2(1, 1) },
          uOpacity: { value: 0 },
          uHover: { value: 0 },
          uIndex: { value: index },
          uTime: { value: 0 },
        },
      }),
    [index]
  );
  const group = useRef();
  const anim = useRef({ hover: 0, open: 0 });
  const tex = useProjectTexture(project.media, true);
  const { camera, size } = useThree();
  const normal = useMemo(() => new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), f.rotationY), [f]);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const W = store.workInSmooth ?? 0;
    const grow = frameGrow(index, W);
    const vis = contentVisible(index, W);
    const a = anim.current;
    a.hover = damp(a.hover, store.workHover === index ? 1 : 0, 6, dt);
    a.open = damp(a.open, store.workOpen === index ? 1 : 0, 4, dt);
    const others = store.workHover >= 0 && store.workHover !== index ? 1 : 0;

    const g = group.current;
    g.visible = grow > 0.0005;
    g.position.copy(f.position).addScaledVector(normal, a.hover * 0.45 + a.open * 0.3 - others * 0.15);
    g.scale.setScalar(1 + a.hover * 0.03);

    // Grow the border clockwise; the bar under construction ends exactly at the front.
    const front = grow * bars[0].total;
    bars.forEach((bar, k) => {
      const ref = barRefs.current[k];
      if (!ref) return;
      const p = THREE.MathUtils.clamp((front - bar.offset) / bar.len, 0, 1);
      ref.visible = p > 0.0005;
      ref.scale.x = Math.max(p, 0.0005);
    });
    // Spark at the growing end, in the accent colour (HDR so it blooms).
    const s = spark.current;
    if (s) {
      s.visible = grow > 0.002 && grow < 0.998;
      frameLocalPoint(f, grow, s.position);
      s.position.z = BAR_DEPTH * 0.6;
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 22) * 0.15;
      s.scale.setScalar(0.55 * pulse);
      accentColor("seamHot", store.accentMix, sparkMat.color).multiplyScalar(3.2);
    }
    g.rotation.y = f.rotationY + Math.sin(state.clock.elapsedTime * 0.2 + index) * 0.015;

    const u = content.uniforms;
    u.uOpacity.value = vis;
    u.uHover.value = Math.max(a.hover, a.open);
    u.uTime.value = state.clock.elapsedTime;
    const t = tex.current;
    if (t.texture && u.uMap.value !== t.texture) {
      u.uMap.value = t.texture;
      u.uHasMap.value = 1;
      const frameAspect = f.w / f.h;
      u.uCover.value.set(t.aspect > frameAspect ? frameAspect / t.aspect : 1, t.aspect > frameAspect ? 1 : t.aspect / frameAspect);
    }
    edgeMat.opacity = 0.55 + a.hover * 0.4;
    accentColor(a.hover > 0.5 ? "edgeHot" : "frameEdge", store.accentMix, edgeMat.color);

    // Screen position of the frame's top-left corner, for the HTML hover label.
    v.set(-f.w / 2, f.h / 2 + 0.25, 0).applyMatrix4(g.matrixWorld).project(camera);
    const sp = store.frames[index] || (store.frames[index] = { x: 0, y: 0, visible: false });
    sp.x = (v.x * 0.5 + 0.5) * size.width;
    sp.y = (-v.y * 0.5 + 0.5) * size.height;
    sp.visible = vis > 0.9 && v.z < 1;
  });

  const interactive = (fn) => (e) => {
    if ((store.workInSmooth ?? 0) < 0.85) return;
    e.stopPropagation();
    fn(e);
  };

  return (
    <group ref={group} position={f.position} rotation-y={f.rotationY}>
      {bars.map((bar, k) => (
        <group
          key={k}
          ref={(r) => (barRefs.current[k] = r)}
          position={[bar.start[0], bar.start[1], 0]}
          rotation-z={bar.rot}
        >
          <mesh
            geometry={bar.geometry}
            material={crystal}
            ref={(m) => m && glassRefs.current.add(m)}
            onPointerOver={interactive(() => {
              store.workHover = index;
              emit("work:hover", index);
              document.body.style.cursor = "pointer";
            })}
            onPointerOut={() => {
              if (store.workHover === index) {
                store.workHover = -1;
                emit("work:hover", -1);
              }
              document.body.style.cursor = "";
            }}
            onClick={interactive(() => emit("work:open", index))}
          />
          <lineSegments geometry={bar.edges} material={edgeMat} ref={(m) => m && glassRefs.current.add(m)} />
        </group>
      ))}
      <sprite ref={spark} material={sparkMat} renderOrder={5} />
      <mesh
        material={content}
        position-z={-0.03}
        onPointerOver={interactive(() => {
          store.workHover = index;
          emit("work:hover", index);
          document.body.style.cursor = "pointer";
        })}
        onPointerOut={() => {
          if (store.workHover === index) {
            store.workHover = -1;
            emit("work:hover", -1);
          }
          document.body.style.cursor = "";
        }}
        onClick={interactive(() => emit("work:open", index))}
      >
        <planeGeometry args={[f.w, f.h]} />
      </mesh>
    </group>
  );
}

/** The Work gallery: one glass frame per project in src/content/projects.js. */
export default function Gallery({ crystal, glassRefs }) {
  const count = PROJECTS.length;
  return (
    <group>
      {PROJECTS.map((p, i) => (
        <Frame key={p.id} index={i} count={count} crystal={crystal} glassRefs={glassRefs} />
      ))}
    </group>
  );
}
