"use client";
"use no memo";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { store, INTERACTIVE, SECTION_COPY } from "@/lib/store";
import { damp, lerp, smoothstep, easeInOut } from "@/lib/math";
import { H_CENTER_Y } from "./useHModel";
import { galleryCamera } from "./gallery";
import { PROJECTS } from "@/content/projects";

/**
 * Camera states:
 *  Genesis → far, frontal, centred on the seed particle
 *  Hero    → off-axis three-quarter view, H centre-right
 *  Exit    → orbit around the H, push in, H centred
 */
export default function CameraRig({ layout }) {
  const s = useMemo(
    () => ({
      pos: new THREE.Vector3(0, H_CENTER_Y + 4, 40),
      look: new THREE.Vector3(layout.hX, H_CENTER_Y, 0),
      wantPos: new THREE.Vector3(),
      wantLook: new THREE.Vector3(),
      svcPos: new THREE.Vector3(),
      svcLook: new THREE.Vector3(),
      fPos: new THREE.Vector3(),
      fLook: new THREE.Vector3(),
      focus: 0,
      open: 0,
      gPos: new THREE.Vector3(),
      gLook: new THREE.Vector3(),
      oPos: new THREE.Vector3(),
      oLook: new THREE.Vector3(),
      side: new THREE.Vector3(),
      px: 0,
      py: 0,
      nav: 0,
      init: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const rm = store.reducedMotion;

    // Smooth the raw scroll value once; everyone else reads heroSmooth.
    store.heroSmooth = damp(store.heroSmooth ?? store.hero, store.hero, rm ? 12 : 5, dt);
    store.servicesSmooth = damp(store.servicesSmooth ?? store.services, store.services, rm ? 12 : 5, dt);
    s.focus = damp(s.focus, store.serviceFocus >= 0 ? 1 : 0, 3, dt);
    store.workInSmooth = damp(store.workInSmooth ?? store.workIn, store.workIn, rm ? 12 : 4, dt);
    store.workSmooth = damp(store.workSmooth ?? store.work, store.work, rm ? 12 : 3.5, dt);
    if (store.workOpen >= 0) s.openIndex = store.workOpen;
    s.open = damp(s.open, store.workOpen >= 0 ? 1 : 0, 3, dt);
    store.accentMix = damp(store.accentMix, store.accent === "orange" ? 1 : 0, rm ? 20 : 3, dt);
    const P = easeInOut(store.heroSmooth);
    const S = easeInOut(store.servicesSmooth);
    const g = easeInOut(smoothstep(0.3, 1, store.genesis));

    const live = INTERACTIVE ? 1 : 0;
    s.px = damp(s.px, store.pointer.x * live, 1.5, dt);
    s.py = damp(s.py, store.pointer.y * live, 1.5, dt);
    s.nav = damp(s.nav, live && store.navHover >= 0 ? (store.navHover - 2) * 0.022 : 0, 2.5, dt);

    const k = rm ? 0.35 : 1;
    const az = lerp(-0.04, layout.az, g) + P * 0.8 * k + s.px * 0.035 * k + s.nav;
    const el = lerp(0.03, layout.el, g) - P * 0.035 + s.py * 0.018 * k;
    const r = lerp(layout.radius * 1.9, layout.radius, g) * (1 - P * 0.2 * k);

    const cx = layout.hX;
    const cy = H_CENTER_Y;
    s.wantPos.set(cx + Math.sin(az) * Math.cos(el) * r, cy + Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);

    // Look target: centred during genesis, offset for the hero layout, centred again on exit.
    const tx = lerp(lerp(cx, cx + layout.offset[0], g), cx, P);
    const ty = lerp(lerp(cy, cy + layout.offset[1], g), cy - 0.1, P);
    s.wantLook.set(tx, ty, 0);

    // Services: a calm frontal view of the four formations.
    const sy = cy + layout.svcLift;
    const sAz = Math.sin(performance.now() / 20000) * 0.03 * k;
    s.svcPos.set(cx + Math.sin(sAz) * layout.svcRadius, sy + Math.sin(0.04) * layout.svcRadius, Math.cos(sAz) * layout.svcRadius);
    s.wantPos.lerp(s.svcPos, S);
    s.wantLook.lerp(s.svcLook.set(cx, sy, 0), S);

    // Selected service: move in close; keep the object right of the detail panel.
    if (s.focus > 0.001 && store.focusPoint) {
      const fp = store.focusPoint;
      const portrait = layout.svcLift < 0;
      s.fPos.set(fp.x + (portrait ? 0 : -2.2), fp.y + 0.6, fp.z + (portrait ? 12 : 9.5));
      s.fLook.set(fp.x + (portrait ? 0 : -2.4), fp.y + (portrait ? -1.6 : 0), fp.z);
      s.wantPos.lerp(s.fPos, s.focus);
      s.wantLook.lerp(s.fLook, s.focus);
    }

    // Work: glide along the gallery arc, always facing one frame.
    const W = easeInOut(store.workInSmooth);
    if (W > 0.0001) {
      const n = PROJECTS.length;
      galleryCamera(store.workSmooth * (n - 1), n, layout.galleryDist, s.gPos, s.gLook);
      // An open project: push in, frame shifted right of the detail panel.
      if (s.open > 0.001 && s.openIndex !== undefined) {
        galleryCamera(s.openIndex, n, layout.galleryDist * 0.78, s.oPos, s.oLook);
        const portrait = layout.svcLift < 0;
        s.side.subVectors(s.oLook, s.oPos).normalize().cross(THREE.Object3D.DEFAULT_UP).multiplyScalar(portrait || !SECTION_COPY ? 0 : -2.6);
        s.oPos.add(s.side);
        s.oLook.add(s.side);
        s.gPos.lerp(s.oPos, s.open);
        s.gLook.lerp(s.oLook, s.open);
      }
      s.wantPos.lerp(s.gPos, W);
      s.wantLook.lerp(s.gLook, W);
    }

    if (!s.init) {
      s.pos.copy(s.wantPos);
      s.look.copy(s.wantLook);
      s.init = true;
    }
    const lambda = rm ? 10 : 4;
    s.pos.x = damp(s.pos.x, s.wantPos.x, lambda, dt);
    s.pos.y = damp(s.pos.y, s.wantPos.y, lambda, dt);
    s.pos.z = damp(s.pos.z, s.wantPos.z, lambda, dt);
    s.look.x = damp(s.look.x, s.wantLook.x, lambda, dt);
    s.look.y = damp(s.look.y, s.wantLook.y, lambda, dt);
    s.look.z = damp(s.look.z, s.wantLook.z, lambda, dt);

    camera.position.copy(s.pos);
    camera.lookAt(s.look);
  }, -1);

  return null;
}
