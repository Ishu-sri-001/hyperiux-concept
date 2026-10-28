/**
 * Hyperiux projects shown in the Work gallery.
 *
 * hyperiux.com does not currently publish its projects, so these entries are
 * empty slots. Fill them in with real work only — never placeholder names,
 * clients or results. Any slot left empty renders as a neutral
 * "Project 0X — to be added" frame.
 *
 *   name      Project name, as published.                         e.g. "Project name"
 *   category  What Hyperiux did.                                  e.g. "UI / UX Design"
 *   summary   One or two sentences about the work.
 *   year      Optional, e.g. "2025".
 *   media     Image (jpg/png/webp) or video (mp4/webm) in /public, e.g. "/work/project.webp".
 *             Landscape ~16:10 works best; it is cover-fitted into the frame.
 *   href      Case study or live site. External links open in a new tab.
 *
 * Add or remove entries freely; the gallery adapts (3–8 projects work best).
 */
export const PROJECTS = [
  { id: "project-01", name: null, category: null, summary: null, year: null, media: null, href: null },
  { id: "project-02", name: null, category: null, summary: null, year: null, media: null, href: null },
  { id: "project-03", name: null, category: null, summary: null, year: null, media: null, href: null },
  { id: "project-04", name: null, category: null, summary: null, year: null, media: null, href: null },
  { id: "project-05", name: null, category: null, summary: null, year: null, media: null, href: null },
  { id: "project-06", name: null, category: null, summary: null, year: null, media: null, href: null },
];

/** Display helpers so the UI never shows invented content. */
export const projectTitle = (p, i) => p.name || `Project ${String(i + 1).padStart(2, "0")}`;
export const isPlaceholder = (p) => !p.name;
