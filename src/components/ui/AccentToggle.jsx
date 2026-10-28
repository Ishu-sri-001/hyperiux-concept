"use client";

import { useEffect, useState } from "react";
import { store, emit } from "@/lib/store";

const KEY = "hx-accent";

/**
 * Gold ↔ Hyperiux orange accent switch. No visible text: the knob shows the
 * current colour. The choice is remembered in this browser.
 */
export default function AccentToggle() {
  const [accent, setAccent] = useState("gold");

  // Pick up the saved choice (applied to <html> before paint by the inline script).
  useEffect(() => {
    const saved = document.documentElement.dataset.accent === "orange" ? "orange" : "gold";
    store.accent = saved;
    store.accentMix = saved === "orange" ? 1 : 0;
    emit("accent", saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccent(saved);
  }, []);

  const toggle = () => {
    const next = accent === "orange" ? "gold" : "orange";
    setAccent(next);
    store.accent = next;
    document.documentElement.dataset.accent = next;
    emit("accent", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  };

  const orange = accent === "orange";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={orange}
      aria-label="Hyperiux orange accent"
      title={orange ? "Accent: Hyperiux orange" : "Accent: gold"}
      className="accent-toggle"
      onClick={toggle}
    >
      <span className="accent-swatch accent-swatch-gold" aria-hidden="true" />
      <span className="accent-swatch accent-swatch-orange" aria-hidden="true" />
      <span className="accent-knob" aria-hidden="true" />
    </button>
  );
}
