"use client";
"use no memo";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { store, on } from "@/lib/store";
import { accentColor, accentHex } from "@/lib/palette";

/**
 * Soft daylight. The environment is built from light panels (no network HDRI):
 * bright softboxes for the glass highlights, a champagne strip for the warm accent,
 * and graphite panels so the glass keeps dark edges against the ivory room.
 */
export default function Lighting({ config, layout }) {
  const sun = useRef();
  const back = useRef();
  // Reflections are baked once per accent; switching accent re-bakes them.
  const [accent, setAccent] = useState(store.accent);
  useEffect(() => on("accent", setAccent), []);
  useFrame(() => {
    if (back.current) accentColor("light", store.accentMix, back.current.color);
  });

  useEffect(() => {
    if (sun.current) sun.current.target.position.set(layout.hX - 2, 0, -8);
  }, [layout.hX]);

  return (
    <>
      <hemisphereLight args={["#e6eef8", "#e2dcd2", 0.75]} />
      <directionalLight
        ref={sun}
        position={[layout.hX + 24, 30, 10]}
        intensity={2.6}
        color="#fff0d8"
        castShadow={config.shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={6}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <directionalLight position={[-10, 8, 24]} intensity={0.55} color="#f4f7fb" />
      {/* Warm back light behind the H: sunlight spilling through the opening. */}
      <pointLight ref={back} position={[layout.hX + 0.5, 4, -4]} intensity={60} distance={20} decay={2} color="#ffd29a" />

      <Environment key={accent} resolution={512} frames={1} environmentIntensity={0.7}>
        <color attach="background" args={["#cfd6de"]} />
        {/* Sky dome and clouds: broad, bright, slightly cool */}
        <Lightformer form="rect" intensity={2.2} color="#e9f1fb" position={[0, 18, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 6, -20]} scale={[40, 10, 1]} target={[0, 3, 0]} />
        {/* Low sun behind the sculpture: the strong warm source the crystal sparkles with */}
        <Lightformer form="circle" intensity={14} color={accentHex("envSun", accent)} position={[3, 9, -16]} scale={3} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={5} color={accentHex("envStrip", accent)} position={[10, 3, 6]} scale={[1.2, 14, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={4} color={accentHex("envStrip2", accent)} position={[-9, 2, -6]} scale={[1.2, 12, 1]} target={[0, 3, 0]} />
        {/* White architecture around the sculpture */}
        <Lightformer form="rect" intensity={1.3} color="#f6f3ee" position={[-16, 6, 4]} scale={[8, 20, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={1.3} color="#f6f3ee" position={[16, 6, 2]} scale={[8, 20, 1]} target={[0, 3, 0]} />
        {/* Deep graphite panels: these become the dark facets inside the glass */}
        <Lightformer form="rect" intensity={1} color="#141414" position={[-6, 3, 14]} scale={[6, 10, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={1} color="#1a1816" position={[7, 4, 13]} scale={[5, 10, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={1} color="#201d1a" position={[0, -8, 4]} rotation-x={-Math.PI / 2} scale={[30, 14, 1]} />
        <Lightformer form="rect" intensity={1} color="#191919" position={[-14, 1, -10]} scale={[4, 8, 1]} target={[0, 3, 0]} />
      </Environment>
    </>
  );
}
