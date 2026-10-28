"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { on, store } from "@/lib/store";

/**
 * Minimal loader. The percentage is the real model-loading progress reported by
 * three's loading manager; before the scene code arrives it shows no number.
 */
export default function Loader({ hidden }) {
  const ref = useRef(null);
  const [pct, setPct] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => on("progress", ({ progress }) => setPct(Math.round(progress))), []);

  useEffect(() => {
    const hide = () => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        autoAlpha: 0,
        duration: store.reducedMotion ? 0.2 : 0.9,
        ease: "power2.out",
        onComplete: () => setGone(true),
      });
    };
    if (store.ready) hide();
    const off = on("ready", hide);
    const failsafe = setTimeout(hide, 9000);
    return () => {
      off();
      clearTimeout(failsafe);
    };
  }, []);

  if (gone || hidden) return null;

  return (
    <div ref={ref} className="loader" role="status" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/hyperiux-wordmark.svg" alt="Hyperiux" className="loader-mark" width={176} height={22} />
      <div className="loader-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${(pct ?? 0) / 100})` }} />
      </div>
      <p className="loader-label">{pct === null ? "Preparing scene" : `Loading model — ${pct}%`}</p>
    </div>
  );
}
