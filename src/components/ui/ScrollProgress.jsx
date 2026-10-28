"use client";

import { useEffect, useRef } from "react";

/** Discreet vertical progress line with the current stage number. */
export default function ScrollProgress({ sections, active }) {
  const fill = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (fill.current) fill.current.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = sections.find((s) => s.id === active);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress-inner">
        <span className="mono scroll-progress-index">{current ? current.index : "02"}</span>
        <span className="scroll-progress-track">
          <span ref={fill} className="scroll-progress-fill" />
        </span>
        <span className="mono scroll-progress-total">09</span>
      </div>
    </div>
  );
}
