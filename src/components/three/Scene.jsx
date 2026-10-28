"use client";
"use no memo";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import Architecture from "./Architecture";
import Lighting from "./Lighting";
import HSculpture from "./HSculpture";
import CameraRig from "./CameraRig";
import { store, emit, HERO_COPY } from "@/lib/store";

/** Composition per viewport: where the H sits and how far the camera is. */
function useLayout() {
  const { size } = useThree();
  return useMemo(() => {
    const aspect = size.width / size.height;
    if (aspect < 0.9) {
      // Portrait / mobile: H in the upper half, copy below it.
      return { hX: 0, hRotY: -0.18, az: -0.22, el: -0.04, radius: 21 + (0.9 - aspect) * 10, offset: [0, HERO_COPY ? -2.6 : -0.3], svcRadius: 26 + (0.9 - aspect) * 14, svcLift: -2.6, galleryDist: 22 + (0.9 - aspect) * 14 };
    }
    if (aspect < 1.35) {
      return { hX: 0, hRotY: -0.18, az: -0.26, el: -0.07, radius: 15.5, offset: [HERO_COPY ? -1.8 : 0, 0.2], svcRadius: 20, svcLift: 1.1, galleryDist: 15 };
    }
    // Desktop: low camera looking slightly up at a large H, centre-right.
    return { hX: 0, hRotY: -0.16, az: -0.28, el: -0.1, radius: 12.2, offset: [HERO_COPY ? -2.55 * Math.min(1.3, aspect / 1.78) : 0, 0.25], svcRadius: 17, svcLift: 0.75, galleryDist: 12.5 };
  }, [size.width, size.height]);
}

/** Compile shaders, wait two frames, then tell the page the scene is ready. */
function Ready() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let raf;
    gl.compile(scene, camera);
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        store.ready = true;
        emit("ready");
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera]);
  return null;
}

function World({ config }) {
  const layout = useLayout();
  return (
    <>
      <Lighting config={config} layout={layout} />
      <Architecture config={config} layout={layout} />
      <HSculpture config={config} layout={layout} />
      <ContactShadows
        position={[layout.hX, 0.012, 0]}
        scale={16}
        blur={2.8}
        far={5}
        opacity={0.3}
        resolution={512}
        color="#6b6255"
      />
      <CameraRig layout={layout} />
      {config.bloom && (
        // Restrained: only HDR champagne highlights (filament light, gold sparkles) cross the threshold.
        <EffectComposer multisampling={4} disableNormalPass>
          <Bloom mipmapBlur luminanceThreshold={2.6} luminanceSmoothing={0.3} intensity={0.8} radius={0.62} />
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      )}
    </>
  );
}

export default function Scene({ config, eventSource }) {
  const [dpr, setDpr] = useState(config.dpr[1]);

  return (
    <Canvas
      shadows={config.shadows ? "percentage" : false}
      dpr={[config.dpr[0], dpr]}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 32, near: 0.1, far: 420, position: [0, 6, 40] }}
      eventSource={eventSource}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
    >
      <color attach="background" args={["#e9edf1"]} />
      <fog attach="fog" args={["#dfe6ee", 80, 220]} />
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(config.dpr[0], d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(config.dpr[1], d + 0.25))}
      />
      <Suspense fallback={null}>
        <World config={config} />
        <Ready />
      </Suspense>
    </Canvas>
  );
}
