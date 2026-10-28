"use client";

import { useEffect, useRef, useState } from "react";
import { store, SECTION_COPY } from "@/lib/store";

/**
 * Service domains. hyperiux.com does not publish a services list; these four come
 * straight from its About copy: "We unravel complex design challenges through
 * meticulous user research, expert analysis, prototyping, and collaborative design
 * with users and stakeholders."
 */
export const SERVICES = [
  {
    n: "01",
    title: "User Research",
    text: "Meticulous research that untangles complex design challenges at their source.",
  },
  {
    n: "02",
    title: "Expert Analysis",
    text: "Expert analysis that turns what we learn into clear design direction.",
  },
  {
    n: "03",
    title: "Prototyping",
    text: "Prototypes that let ideas be seen, tested and refined early.",
  },
  {
    n: "04",
    title: "Collaborative Design",
    text: "Designing together with the people who use and own the product: users and stakeholders.",
  },
];

const ABOUT =
  "We unravel complex design challenges through meticulous user research, expert analysis, prototyping, and collaborative design with users and stakeholders. Harnessing the power of cutting edge tools and our proprietary approach we craft delightful and intuitive experiences.";

export default function Services({ focus, setFocus }) {
  const [hover, setHover] = useState(-1);
  const anchors = useRef([]);
  const line = useRef(null);
  const backRef = useRef(null);

  const enter = (i) => setHover(i);
  const leave = () => setHover(-1);

  // Mirror UI state into the shared scene state.
  useEffect(() => {
    store.serviceHover = hover;
  }, [hover]);

  // Fine connector between the hovered text and its glass formation.
  const active = focus >= 0 ? -1 : hover;
  useEffect(() => {
    if (active < 0) return;
    let raf;
    const tick = () => {
      const a = anchors.current[active];
      const l = line.current;
      if (a && l) {
        const r = a.getBoundingClientRect();
        const f = store.formations[active];
        l.setAttribute("x1", r.left + r.width / 2);
        l.setAttribute("y1", r.top + r.height / 2);
        l.setAttribute("x2", f.x);
        l.setAttribute("y2", f.y);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  useEffect(() => {
    if (focus < 0) return;
    backRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === "Escape" && setFocus(-1);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, setFocus]);

  const current = focus >= 0 ? SERVICES[focus] : null;

  if (!SECTION_COPY) {
    // Visual only for now: the exploded crystal H. Content stays available to screen readers.
    return (
      <div className="services-track" id="services" data-section="services">
        <section className="services" aria-labelledby="services-title">
          <div className="sr-only">
            <h2 id="services-title">Services</h2>
            <ol>
              {SERVICES.map((s) => (
                <li key={s.n}>
                  {s.title}: {s.text}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="services-track" id="services" data-section="services">
      <section className={`services ${focus >= 0 ? "is-focused" : ""}`} aria-labelledby="services-title">
        <header className="services-head">
          <p className="mono" data-svc-reveal>
            <span className="meta-index">04</span> Services
          </p>
          <h2 id="services-title" className="services-title" data-svc-reveal>
            The Elements
          </h2>
          <p className="services-lead" data-svc-reveal>
            How we craft delightful and intuitive experiences.
          </p>
        </header>

        <ol className="services-list">
          {SERVICES.map((s, i) => (
            <li key={s.n} className={`service slot-${i} ${hover === i ? "is-hover" : ""}`} data-svc-reveal>
              <button
                type="button"
                className="service-button"
                onPointerEnter={() => enter(i)}
                onPointerLeave={leave}
                onFocus={() => enter(i)}
                onBlur={leave}
                onClick={() => setFocus(i)}
                aria-expanded={focus === i}
                aria-controls="service-detail"
              >
                <span className="mono service-n">{s.n}</span>
                <span className="service-title">{s.title}</span>
                <span className="service-text">{s.text}</span>
                <span className="service-anchor" ref={(el) => (anchors.current[i] = el)} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <svg className={`services-connector ${active >= 0 ? "is-on" : ""}`} aria-hidden="true">
          <line ref={line} x1="0" y1="0" x2="0" y2="0" />
        </svg>

        <div id="service-detail" className="service-detail" hidden={!current} role="region" aria-label={current ? current.title : undefined}>
          {current && (
            <>
              <p className="mono">
                <span className="meta-index">{current.n}</span> Service
              </p>
              <h3 className="service-detail-title">{current.title}</h3>
              <p className="service-detail-text">{current.text}</p>
              <blockquote className="service-detail-quote">
                <p>{ABOUT}</p>
                <cite className="mono">Hyperiux — About</cite>
              </blockquote>
              <div className="service-detail-actions">
                <button type="button" ref={backRef} className="text-link as-button" onClick={() => setFocus(-1)}>
                  <span aria-hidden="true">←</span> All services
                </button>
                <button type="button" className="text-link as-button" onClick={() => setFocus((focus + 1) % SERVICES.length)}>
                  Next: {SERVICES[(focus + 1) % SERVICES.length].title} <span aria-hidden="true">→</span>
                </button>
                <a className="cta" href={`mailto:hi@hyperiux.com?subject=${encodeURIComponent(`Project enquiry — ${current.title}`)}`}>
                  <span className="cta-label">Start a project</span>
                  <span className="cta-rule" aria-hidden="true" />
                  <span className="cta-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.25" />
                    </svg>
                  </span>
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
