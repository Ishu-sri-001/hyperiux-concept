"use client";

import { useEffect, useRef } from "react";
import { store, SECTION_COPY } from "@/lib/store";
import { PROJECTS, projectTitle, isPlaceholder } from "@/content/projects";

const pad = (n) => String(n).padStart(2, "0");

function ProjectLink({ project, children, className }) {
  if (!project.href) return null;
  const external = /^https?:\/\//.test(project.href);
  return (
    <a
      className={className}
      href={project.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export default function Work({ index, open, setOpen, hover, onGo }) {
  const n = PROJECTS.length;
  const current = PROJECTS[index];
  const opened = open >= 0 ? PROJECTS[open] : null;
  const label = useRef(null);
  const backRef = useRef(null);

  // Restrained title label that follows the hovered frame.
  useEffect(() => {
    if (hover < 0) return;
    let raf;
    const tick = () => {
      const f = store.frames[hover];
      const el = label.current;
      if (f && el) {
        el.style.transform = `translate(${f.x}px, ${f.y}px) translateY(-100%)`;
        el.style.opacity = f.visible ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [hover]);

  useEffect(() => {
    if (open < 0) return;
    backRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === "Escape" && setOpen(-1);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (i) => onGo(Math.max(0, Math.min(n - 1, i)));

  if (!SECTION_COPY) {
    // Text-free for now: only icon controls. Project names stay available to screen readers.
    return (
      <div className="work-track" id="work" data-section="work" style={{ height: `${100 + n * 55}svh` }}>
        <section className={`work ${open >= 0 ? "is-open" : ""}`} aria-labelledby="work-title">
          <h2 id="work-title" className="sr-only">
            Work
          </h2>
          <p className="sr-only" aria-live="polite">
            {projectTitle(current, index)}, {index + 1} of {n}
          </p>
          <div className="work-ui">
            <nav className="work-nav work-nav-icons" aria-label="Projects">
              <button type="button" className="work-arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous project">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" className="work-arrow" onClick={() => go(index + 1)} disabled={index === n - 1} aria-label="Next project">
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          </div>
          {open >= 0 && (
            <button type="button" ref={backRef} className="work-arrow work-close" onClick={() => setOpen(-1)} aria-label="Back to all projects">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </section>
      </div>
    );
  }

  return (
    <div
      className="work-track"
      id="work"
      data-section="work"
      style={{ height: `${100 + n * 55}svh` }}
    >
      <section
        className={`work ${open >= 0 ? "is-open" : ""}`}
        aria-labelledby="work-title"
      >
        <div className="work-ui">
          <header className="work-head">
            <p className="mono" data-work-reveal>
              <span className="meta-index">05</span> Work
            </p>
            <h2 id="work-title" className="work-title" data-work-reveal>
              Our Work
            </h2>
          </header>

          <div className="work-current" aria-live="polite" data-work-reveal>
            <p className="mono work-count">
              <span className="meta-index">{pad(index + 1)}</span> / {pad(n)}
            </p>
            <h3 className="work-name">{projectTitle(current, index)}</h3>
            <p className="work-category">
              {isPlaceholder(current) ? "To be added" : current.category}
            </p>
            <button
              type="button"
              className="text-link as-button"
              onClick={() => setOpen(index)}
            >
              View project <span aria-hidden="true">→</span>
            </button>
          </div>

          <nav className="work-nav" aria-label="Projects" data-work-reveal>
            <button
              type="button"
              className="work-arrow"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous project"
            >
              <span aria-hidden="true">←</span>
            </button>
            <ol className="work-dots">
              {PROJECTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`work-dot ${i === index ? "is-active" : ""}`}
                    aria-current={i === index ? "true" : undefined}
                    aria-label={`${projectTitle(p, i)}${isPlaceholder(p) ? " (to be added)" : ""}`}
                    onClick={() => go(i)}
                  >
                    <span className="mono">{pad(i + 1)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="work-arrow"
              onClick={() => go(index + 1)}
              disabled={index === n - 1}
              aria-label="Next project"
            >
              <span aria-hidden="true">→</span>
            </button>
          </nav>
        </div>

        <div
          ref={label}
          className={`work-hover-label ${hover >= 0 && open < 0 ? "is-on" : ""}`}
          aria-hidden="true"
        >
          {hover >= 0 && (
            <>
              <span className="mono">{pad(hover + 1)}</span>
              <span className="work-hover-name">
                {projectTitle(PROJECTS[hover], hover)}
              </span>
              <span className="work-hover-cat">
                {isPlaceholder(PROJECTS[hover])
                  ? "To be added"
                  : PROJECTS[hover].category}
              </span>
            </>
          )}
        </div>

        <div
          className="project-panel"
          hidden={!opened}
          role="region"
          aria-label={opened ? projectTitle(opened, open) : undefined}
        >
          {opened && (
            <>
              <p className="mono">
                <span className="meta-index">{pad(open + 1)}</span> Project
                {opened.year ? ` · ${opened.year}` : ""}
              </p>
              <h3 className="project-panel-title">
                {projectTitle(opened, open)}
              </h3>
              {isPlaceholder(opened) ? (
                <p className="project-panel-text project-panel-empty">
                  This project has not been added yet. Its name, images and case
                  study will appear here.
                </p>
              ) : (
                <>
                  {opened.category && (
                    <p className="project-panel-category">{opened.category}</p>
                  )}
                  {opened.summary && (
                    <p className="project-panel-text">{opened.summary}</p>
                  )}
                </>
              )}
              <div className="service-detail-actions">
                <button
                  type="button"
                  ref={backRef}
                  className="text-link as-button"
                  onClick={() => setOpen(-1)}
                >
                  <span aria-hidden="true">←</span> Back to work
                </button>
                {open < n - 1 && (
                  <button
                    type="button"
                    className="text-link as-button"
                    onClick={() => {
                      go(open + 1);
                      setOpen(open + 1);
                    }}
                  >
                    Next project <span aria-hidden="true">→</span>
                  </button>
                )}
                <ProjectLink project={opened} className="cta">
                  <span className="cta-label">View case study</span>
                  <span className="cta-rule" aria-hidden="true" />
                  <span className="cta-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M5 12h13M13 6l6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                      />
                    </svg>
                  </span>
                </ProjectLink>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
