"use client";

import { INTERACTIVE, HERO_COPY } from "@/lib/store";

const LINES = ["We shape", "digital", "experiences."];

export default function Hero({ onNavigate }) {
  if (!HERO_COPY) {
    // Visual hero is the 3D sculpture alone; the heading stays for screen readers and search.
    return (
      <div className="hero-track" id="top">
        <section className="hero" id="hero" data-section="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="sr-only">
            Hyperiux — Digital Experience Design Agency. We shape digital experiences.
          </h1>
        </section>
      </div>
    );
  }

  return (
    <div className="hero-track" id="top">
      <section className="hero" id="hero" data-section="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow" data-reveal>
            Digital Experience Design Agency
          </p>
          <h1 id="hero-title" className="hero-title" aria-label="We shape digital experiences.">
            {LINES.map((l) => (
              <span className="line" key={l} aria-hidden="true">
                <span className="line-inner">{l}</span>
              </span>
            ))}
          </h1>
          <p className="hero-sub" data-reveal>
            A creative digital agency building immersive, interactive, and unforgettable digital experiences.
          </p>
          <div data-reveal>
            <a
              href="#work"
              className="cta"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("work");
              }}
            >
              <span className="cta-label">Explore our work</span>
              <span className="cta-rule" aria-hidden="true" />
              <span className="cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        <div className="hero-meta">
          <p className="mono" data-reveal>
            <span className="meta-index">02</span> The Core
          </p>
        </div>

        {INTERACTIVE && (
          <div className="hero-hint" aria-hidden="true">
            <p className="mono" data-reveal>
              <span className="hint-fine">Move to influence · Click the H</span>
              <span className="hint-touch">Drag to influence · Tap the H</span>
            </p>
          </div>
        )}

        <div className="scroll-cue" aria-hidden="true">
          <div data-reveal>
            <span className="mono">Scroll to explore</span>
            <span className="scroll-cue-line" />
          </div>
        </div>
      </section>
    </div>
  );
}
