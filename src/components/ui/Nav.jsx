"use client";

import { useEffect, useState } from "react";
import { store } from "@/lib/store";
import AccentToggle from "./AccentToggle";

export default function Nav({ sections, active, onNavigate }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (e, id) => {
    e.preventDefault();
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className={`nav ${open ? "is-open" : ""}`}>
      <a href="#top" className="nav-mark" onClick={(e) => go(e, "top")} data-reveal aria-label="Hyperiux — back to top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hyperiux-wordmark.svg" alt="Hyperiux" width={132} height={16} />
      </a>

      <div className="accent-toggle-wrap" data-reveal>
        <AccentToggle />
      </div>

      <nav aria-label="Primary">
        <ul className="nav-links">
          {sections.map((s, i) => (
            <li key={s.id} data-reveal>
              <a
                href={`#${s.id}`}
                className={`nav-link ${active === s.id ? "is-active" : ""}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={(e) => go(e, s.id)}
                onPointerEnter={() => (store.navHover = i)}
                onPointerLeave={() => (store.navHover = -1)}
                onFocus={() => (store.navHover = i)}
                onBlur={() => (store.navHover = -1)}
              >
                <span className="nav-link-text">{s.label}</span>
                <span className="nav-trace" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-panel"
        onClick={() => setOpen((o) => !o)}
        data-reveal
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className="nav-toggle-lines" aria-hidden="true" />
      </button>

      <div id="nav-panel" className="nav-panel" hidden={!open}>
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={(e) => go(e, s.id)} className={active === s.id ? "is-active" : ""}>
                <span className="mono">{s.index}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
