"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { prepareH } from "@/lib/hGeometry";

export { H_HEIGHT, H_CENTER_Y, PIECES } from "@/lib/hGeometry";

export const H_MODEL_URL = "/models/hyperiexLogoNo2.glb";

/**
 * Loads the Hyperiux H (the GLB from hyperiux.com) and prepares its pieces,
 * shards and filaments. See src/lib/hGeometry.js for the geometry work.
 */
export function useHModel(shardCount = 60) {
  const gltf = useGLTF(H_MODEL_URL, false, false);
  return useMemo(() => {
    let mesh = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!mesh && o.isMesh) mesh = o;
    });
    return prepareH(mesh, { shardCount });
  }, [gltf, shardCount]);
}

useGLTF.preload(H_MODEL_URL, false, false);
